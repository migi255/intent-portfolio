import assert from 'node:assert/strict'
import test from 'node:test'

import { entries } from '../.test-build/data/content.js'
import { evaluate } from '../.test-build/evaluation/evaluate.js'
import { describeCriteria, explainMatch, suggestBroaderIntents, suggestedIntents } from '../.test-build/intent/interpretation.js'
import { planInterface, validatePlan } from '../.test-build/planning/plan.js'
import { caseStudyView, createNavigation, evidenceView, queryView, readView, viewSearch } from '../.test-build/state/navigation.js'

function run(query) {
  const view = evidenceView(query)
  assert.equal(view.intent.status, 'resolved', query)
  const result = evaluate(view.intent.expression, entries)
  const plan = planInterface(view.intent, result)
  assert.ok(validatePlan(plan, entries), query)
  return { view, result, plan, ids: plan.blocks.flatMap(block => block.entryIds) }
}

test('every suggested intent produces visible results from the public catalog', () => {
  for (const { query } of suggestedIntents) {
    const { view, ids } = run(query)
    assert.equal(view.intent.presentation, 'grouped')
    assert.ok(ids.length > 0, query)
  }
})

test('one intent groups actual matches across projects, decisions, and experience', () => {
  const { view, result, plan } = run('Where testing changed the design')
  assert.deepEqual(plan.blocks.map(block => block.kind), ['cards', 'decisions', 'experience-records'])
  assert.deepEqual(plan.blocks.map(block => block.entryIds), [
    ['ariadne', 'synkrita'],
    ['ariadne-ambiguity', 'synkrita-connector-baseline'],
    ['ariadne-experience', 'synkrita-engineering'],
  ])
  assert.ok(result.matches.every(entry => explainMatch(entry, view.intent.expression).includes('evaluation-driven decisions')))
  const restricted = run('Projects where testing changed the design')
  assert.deepEqual(restricted.plan.blocks, [{ kind: 'cards', entryIds: ['ariadne', 'synkrita'] }])
  assert.deepEqual(run('what experience do you have with access control?').ids, ['tohsa-engineering'])
})

test('interpretation reflects the parsed criteria, alternatives, and exclusions', () => {
  const { view, result, ids } = run('Professional work, not coursework')
  assert.deepEqual(view.intent.expression, {
    type: 'and',
    left: { type: 'predicate', predicate: { field: 'context', value: 'professional' } },
    right: { type: 'not', expression: { type: 'predicate', predicate: { field: 'context', value: 'coursework' } } },
  })
  assert.equal(describeCriteria(view.intent.expression, entries), 'Professional work and not Coursework')
  assert.deepEqual(ids, ['mass-spectrometry-analysis', 'tohsa', 'mass-spectrometry-analysis-performance', 'mass-spectrometry-analysis-engineering', 'tohsa-engineering'])
  assert.deepEqual(explainMatch(result.matches[0], view.intent.expression), ['Professional work', 'not Coursework'])
  assert.equal(evaluate(view.intent.expression, [{ ...result.matches[0], context: 'coursework' }]).matches.length, 0)

  const alternatives = run('(Java or Scala) and not coursework')
  assert.equal(describeCriteria(alternatives.view.intent.expression, entries), '(Java or Scala) and not Coursework')
  assert.deepEqual(explainMatch(alternatives.result.matches.find(entry => entry.id === 'tohsa'),
    alternatives.view.intent.expression), ['Java', 'not Coursework'])
  assert.deepEqual(explainMatch(alternatives.result.matches.find(entry => entry.id === 'mass-spectrometry-analysis'),
    alternatives.view.intent.expression), ['Scala', 'not Coursework'])
})

test('the example phrases only match catalog evidence for their actual interpreted filters', () => {
  const access = run('backend systems involving access control')
  assert.equal(describeCriteria(access.view.intent.expression, entries), 'Backend and controlled access')
  assert.deepEqual(access.ids, ['tohsa', 'tohsa-engineering'])
  assert.deepEqual(run('AI systems with deterministic boundaries').ids,
    ['ariadne', 'ariadne-execution-boundary', 'ariadne-experience'])
  assert.ok(run('work involving knowledge graphs').ids.includes('ariadne'))
  assert.ok(run('scientific software').ids.includes('mass-spectrometry-analysis'))
})

test('grouped URLs restore the same criteria without storing the original request', () => {
  const { view, plan } = run('backend systems involving access control')
  const url = viewSearch(view)
  assert.match(url, /presentation=grouped/)
  assert.doesNotMatch(url, /q=|involving/)
  const restored = readView(url)
  assert.equal(restored.query, '')
  assert.deepEqual(restored.intent, view.intent)
  assert.deepEqual(planInterface(restored.intent, evaluate(restored.intent.expression, entries)), plan)
})

test('the direct browse surface and canonical case studies keep their specialized layouts', () => {
  const navigation = createNavigation({ history: { state: null }, location: { href: 'https://portfolio.test/' } })
  const modes = [
    ['projects', ['cards']],
    ['experience', ['skills', 'comparison']],
    ['decisions', ['decisions']],
  ]
  for (const [goal, expected] of modes) {
    const url = new URL(navigation.href(queryView(goal)))
    assert.equal(url.hash, '#results')
    const { intent } = readView(url.search)
    assert.equal(intent.goal, goal)
    assert.deepEqual(planInterface(intent, evaluate(intent.expression, entries)).blocks.map(block => block.kind), expected)
  }
  const query = run('case study Ariadne')
  assert.deepEqual(query.plan.blocks, [{ kind: 'case-study', entryIds: ['ariadne'] }])
  assert.equal(viewSearch(query.view), viewSearch(caseStudyView('ariadne')))
  assert.deepEqual(run('compare data integration').plan.blocks, [{ kind: 'comparison', entryIds: ['tohsa-engineering', 'synkrita-engineering'] }])
})

test('zero results keep the original query and offer only actual one-criterion relaxations', () => {
  const raw = 'Scala and Java'
  const empty = run(raw)
  assert.equal(empty.view.query, raw)
  assert.deepEqual(empty.ids, [])
  const options = suggestBroaderIntents(empty.view.intent, entries)
  assert.deepEqual(options.map(({ removed, count }) => [removed, count]), [['Scala', 2], ['Java', 3]])
  for (const { intent, count } of options) {
    const plan = planInterface(intent, evaluate(intent.expression, entries))
    assert.equal(plan.blocks.flatMap(block => block.entryIds).length, count)
  }
  assert.equal(empty.view.query, raw)
  assert.deepEqual(suggestBroaderIntents(run('PostgreSQL').view.intent, entries), [])
})

test('only approved public IDs and titles participate in grouped search and URL filters', () => {
  // A closed catalog invariant keeps private titles and IDs out of tracked test fixtures.
  const approved = [
    'mass-spectrometry-analysis', 'mass-spectrometry-analysis-engineering', 'tohsa', 'tohsa-engineering',
    'ariadne', 'ariadne-experience', 'ariadne-execution-boundary', 'ariadne-ambiguity', 'mass-spectrometry-analysis-performance',
    'synkrita', 'synkrita-engineering', 'synkrita-connector-baseline',
    'geas', 'geas-engineering', 'geas-story-authority', 'geas-narrative-stability', 'intent-pipeline',
  ]
  assert.deepEqual(entries.map(entry => entry.id).sort(), approved.sort())
  assert.ok(entries.every(entry => entry.evidence.status === 'approved'))
  assert.equal(evidenceView('unlisted project title').intent.status, 'unsupported')
  const unknownFilter = new URLSearchParams({ view: 'decisions', filter: 'id:unlisted', presentation: 'grouped' })
  assert.deepEqual(readView('?' + unknownFilter), queryView('decisions'))
})

test('research delivery and coordination queries surface the relevant public records', () => {
  const projectIds = { g: 'mass-spectrometry-analysis', t: 'tohsa', s: 'synkrita' }
  const cases = [
    ['Working with scientists to define requirements', 'gts'],
    ['Delivering software from requirements to deployment', 'g'],
    ['Iterative research software development', 'g'],
    ['Coordinating engineering work across contributors', 't'],
    ['Managing technical dependencies', 't'],
    ['Scientific software testing and validation', 'gt'],
    ['Balancing performance and scientific correctness', 'g!'],
    ['Research data access control and security', 't'],
    ['Benchmarking scientific software', 'gt'],
    ['Collaborating with biomedical researchers', 'gts'],
    ['Mentoring students and junior contributors', 't'],
    ['Integrating scientific datasets and services', 'ts'],
    ['Translating research needs into technical architecture', 'ts'],
    ['Maintaining scientific applications', 'g'],
    ['Scientific workflow reproducibility', 's'],
    ['AI-assisted scientific infrastructure', 's'],
  ]
  for (const [query, expected] of cases) {
    const projects = Array.from(expected.replace('!', ''), key => projectIds[key])
    const decisions = expected.endsWith('!') ? ['mass-spectrometry-analysis-performance'] : []
    assert.deepEqual(run(query).ids, [
      ...projects, ...decisions, ...projects.map(id => id + '-engineering'),
    ], query)
  }
  for (const query of ['GxP release management', 'Nextflow production pipelines', 'computerized system validation']) {
    assert.equal(evidenceView(query).intent.status, 'unsupported', query)
  }
})

test('research delivery searches accept alternate phrasing and preserve explicit scope', () => {
  assert.deepEqual(run('Show projects that involved researcher collaboration').ids, [
    'mass-spectrometry-analysis', 'tohsa', 'synkrita',
  ])
  assert.deepEqual(run('What experience do you have with iterative software delivery and requirements interpretation?').ids,
    ['mass-spectrometry-analysis-engineering'])
  assert.deepEqual(run('Which projects involve scientific benchmarking and controlled access?').ids, ['tohsa'])
  assert.deepEqual(run('Tell me about student mentoring').ids, ['tohsa', 'tohsa-engineering'])
})
