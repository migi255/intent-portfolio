import assert from 'node:assert/strict'
import test from 'node:test'

import { entries } from '../.test-build/data/content.js'
import { evaluate } from '../.test-build/evaluation/evaluate.js'
import { parseIntent, resolveGoal } from '../.test-build/intent/parser.js'
import { planInterface, validatePlan } from '../.test-build/planning/plan.js'
import { readView, viewSearch } from '../.test-build/state/navigation.js'

function run(query, fallback, chosenGoal) {
  const intent = parseIntent(query, fallback, chosenGoal)
  assert.equal(intent.status, 'resolved', JSON.stringify(intent))
  const result = evaluate(intent.expression, entries)
  return { intent, result, ids: result.matches.map(entry => entry.id), plan: planInterface(intent, result) }
}

test('parses an explicit conjunction into typed predicates', () => {
  const { intent, ids } = run('projects AND backend')
  assert.deepEqual(intent.expression, {
    type: 'and',
    left: { type: 'predicate', predicate: { field: 'kind', value: 'project' } },
    right: { type: 'predicate', predicate: { field: 'category', value: 'backend' } },
  })
  assert.deepEqual(ids, ['dataset-catalog', 'event-replay'])
})

test('AND binds more tightly than OR and NOT binds to its operand', () => {
  assert.deepEqual(run('frontend OR Python AND NOT coursework').ids, ['dataset-catalog', 'release-dashboard'])
  assert.deepEqual(run('frontend OR Python AND NOT independent').ids, ['release-dashboard', 'event-replay'])
  assert.deepEqual(run('NOT NOT Python').ids, ['dataset-catalog', 'event-replay'])
})

test('evaluates nested groups and respects explicit precedence changes', () => {
  assert.deepEqual(run('(frontend OR (backend AND Python)) AND NOT (Docker OR coursework)').ids, ['dataset-catalog'])
  assert.deepEqual(run('(frontend OR Python) AND NOT independent').ids, ['event-replay'])
})

test('resolves aliases, punctuation, and the supported natural-language requests', () => {
  const cases = [
    ['Show me your backend projects.', 'projects', ['dataset-catalog', 'event-replay']],
    ['What have you built using Python?', 'projects', ['dataset-catalog', 'event-replay']],
    ['Show projects involving APIs but not coursework.', 'projects', ['dataset-catalog']],
    ['What experience do you have with infrastructure?', 'experience', ['release-tooling']],
    ['How do you approach system architecture?', 'decisions', ['dataset-catalog', 'release-dashboard', 'event-replay', 'intent-pipeline']],
    ['Show me your most relevant projects for front-end engineering.', 'projects', ['release-dashboard']],
    ['Back-end using Postgres', 'projects', ['dataset-catalog']],
  ]
  for (const [query, goal, ids] of cases) {
    assert.equal(run(query).intent.goal, goal)
    assert.deepEqual(run(query).ids, ids)
  }
  assert.equal(run('What have you built using Python?', 'experience').intent.goal, 'projects')
})

test('returns unsupported syntax and terms explicitly', () => {
  for (const query of ['projects AND', '(Python OR React', 'Python)', 'AND Python', 'show me', 'Python AND OR React']) {
    assert.equal(parseIntent(query).status, 'unsupported', query)
  }
  assert.deepEqual(parseIntent('Show me Rust projects').terms, ['rust'])
  assert.equal(parseIntent('x'.repeat(241)).status, 'unsupported')
})

test('an ambiguous goal can be selected without changing the expression or dropping matches', () => {
  const query = 'projects OR experience'
  assert.deepEqual(parseIntent(query).goals, ['projects', 'experience'])
  assert.equal(parseIntent(query).status, 'ambiguous')
  const projects = run(query, 'projects', 'projects')
  const experience = run(query, 'projects', 'experience')
  assert.equal(experience.intent.goal, 'experience')
  assert.deepEqual(projects.intent.expression, experience.intent.expression)
  assert.deepEqual(projects.ids, experience.ids)
  assert.notDeepEqual(projects.plan, experience.plan)
})

test('missing attributes and unsupported predicates remain indeterminate, even when negated', () => {
  const entry = { ...entries[0], technologies: undefined }
  const result = evaluate(parseIntent('not Python').expression, [entry])
  assert.deepEqual(result, { matches: [], evaluatedCount: 1, indeterminateCount: 1 })
  const unsupported = { type: 'predicate', predicate: { field: 'unsupported', value: true } }
  assert.equal(evaluate({ type: 'not', expression: unsupported }, [entry]).indeterminateCount, 1)
  const projected = evaluate({ type: 'or', left: unsupported, right: { type: 'all' } }, [entry])
  assert.deepEqual(projected.matches, [entry])
})

test('empty results produce an empty plan', () => {
  const { ids, plan } = run('frontend AND Python')
  assert.deepEqual(ids, [])
  assert.deepEqual(plan, { goal: 'projects', blocks: [] })
})

test('planner selects distinct layouts and supports explicitly requested views', () => {
  assert.deepEqual(run('').plan.blocks.map(block => block.kind), ['cards'])
  assert.deepEqual(run('', 'experience').plan.blocks.map(block => block.kind), ['skills', 'comparison', 'timeline'])
  assert.deepEqual(run('', 'decisions').plan.blocks.map(block => block.kind), ['decisions'])
  assert.deepEqual(run('career timeline').plan.blocks.map(block => block.kind), ['timeline'])
  assert.deepEqual(run('compare infrastructure').plan.blocks.map(block => block.kind), ['comparison'])
  const detail = run('case study Dataset Catalog')
  assert.deepEqual(detail.plan.blocks, [{ kind: 'case-study', entryIds: ['dataset-catalog'] }])
})

test('validates plan structure and rejects unregistered, duplicate, or missing references', () => {
  const { plan } = run('Backend projects')
  assert.equal(validatePlan(plan, entries), true)
  for (const invalid of [
    null,
    { goal: 'other', blocks: [] },
    { goal: 'projects', blocks: [{ kind: 'script', entryIds: [entries[0].id] }] },
    { goal: 'projects', blocks: [{ kind: 'cards', entryIds: ['missing'] }] },
    { goal: 'projects', blocks: [{ kind: 'cards', entryIds: [] }] },
    { goal: 'projects', blocks: [{ kind: 'cards', entryIds: [entries[0].id, entries[0].id] }] },
    { ...plan, blocks: [...plan.blocks, ...plan.blocks] },
    { goal: 'experience', blocks: [{ kind: 'timeline', entryIds: ['dataset-catalog'] }] },
    { goal: 'decisions', blocks: [{ kind: 'case-study', entryIds: ['catalog-api'] }] },
  ]) assert.equal(validatePlan(invalid, entries), false)
})

test('evaluation and planning are deterministic', () => {
  assert.deepEqual(run('(frontend OR backend) AND NOT coursework'), run('(frontend OR backend) AND NOT coursework'))
  const intent = resolveGoal('experience')
  const result = evaluate(intent.expression, entries)
  assert.deepEqual(result.matches.map(entry => entry.id), ['catalog-api', 'release-tooling'])
})

test('shareable view params round-trip committed queries and chosen layouts', () => {
  const state = { goal: 'experience', query: 'React AND NOT coursework', chosenGoal: 'projects' }
  assert.deepEqual(readView(viewSearch(state)), state)
  assert.deepEqual(readView('?view=unknown&layout=constructor'), { goal: 'projects', query: '' })
})
