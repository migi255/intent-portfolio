import assert from 'node:assert/strict'
import test from 'node:test'

import { entries } from '../.test-build/data/content.js'
import { evaluate } from '../.test-build/evaluation/evaluate.js'
import { parseIntent, resolveGoal } from '../.test-build/intent/parser.js'
import { createTokenizer } from '../.test-build/intent/vocabulary.js'
import { planInterface, validatePlan } from '../.test-build/planning/plan.js'
import { createNavigation, queryView, readView, viewSearch } from '../.test-build/state/navigation.js'

function run(query, fallback, chosenGoal) {
  const intent = parseIntent(query, fallback, chosenGoal)
  assert.equal(intent.status, 'resolved', JSON.stringify(intent))
  const result = evaluate(intent.expression, entries)
  return { intent, result, ids: result.matches.map(entry => entry.id), plan: planInterface(intent, result) }
}

test('matches full registered titles beyond five words before interpreting embedded operators', () => {
  const titles = [
    { id: 'example-one', title: 'Translating design feedback into smaller releases' },
    { id: 'example-two', title: 'Maintaining and improving a long-running service' },
  ]
  const tokenize = createTokenizer(titles)
  for (const { id, title } of titles) {
    const predicate = { type: 'predicate', predicate: { field: 'id', value: id } }
    assert.deepEqual(tokenize(title), { tokens: [predicate], unknown: [] })
    assert.deepEqual(tokenize('Case study ' + title.toUpperCase() + ' AND Python?'), {
      tokens: [
        { type: 'presentation', presentation: 'case-study' },
        predicate,
        { type: 'and' },
        { type: 'predicate', predicate: { field: 'technology', value: 'Python' } },
      ],
      unknown: [],
    })
  }
})

test('a bare entry title selects the layout for that entry from another view', () => {
  const result = run('Separate matching from presentation', 'projects')
  assert.equal(result.intent.goal, 'decisions')
  assert.deepEqual(result.ids, ['intent-pipeline'])
})

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

test('scientific engineering vocabulary resolves supported intent examples deterministically', () => {
  const cases = [
    ['Show performance optimization experience.', 'performance optimization'],
    ['Which projects involved maintaining existing software?', 'system maintenance'],
    ['Show experience with Scala.', 'Scala'],
    ['How do you validate algorithm changes?', 'differential testing'],
    ['Show examples of responding to user feedback.', 'requirements interpretation'],
    ['What testing practices have you used?', 'regression testing'],
    ['Which projects demonstrate debugging?', 'debugging'],
    ['How do you preserve correctness when optimizing software?', 'scientific correctness'],
    ['Show your CI/CD experience.', 'CI/CD'],
  ]
  for (const [query, value] of cases) {
    const intent = parseIntent(query)
    assert.equal(intent.status, 'resolved', `${query}: ${JSON.stringify(intent)}`)
    const predicates = []
    function collect(expression) {
      if (expression.type === 'predicate') predicates.push(expression.predicate.value)
      else if (expression.type === 'not') collect(expression.expression)
      else if (expression.type === 'and' || expression.type === 'or') { collect(expression.left); collect(expression.right) }
    }
    collect(intent.expression)
    assert.ok(predicates.includes(value), `${query}: expected criterion ${value}`)
    assert.deepEqual(intent, parseIntent(query))
  }
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

test('shareable URLs encode validated filters without carrying query phrasing', () => {
  const query = '  Back-end and (Postgres OR Python) excluding coursework.  '
  const view = queryView('projects', query)
  const search = viewSearch(view)
  assert.equal(view.intent.status, 'resolved')
  const params = new URLSearchParams(search)
  assert.deepEqual([...params.keys()], ['filter'])
  assert.equal(params.get('filter'),
    'kind:project,category:backend,technology:PostgreSQL,technology:Python,or,and,context:coursework,not,and,and')
  assert.ok(!decodeURIComponent(search).includes('Postgres OR Python'))
  assert.equal(viewSearch(queryView('projects', 'backend AND (PostgreSQL OR Python) AND NOT coursework')), search)
  const restored = readView(search)
  assert.equal(restored.query, '')
  assert.deepEqual(restored.intent, view.intent)
  assert.deepEqual(evaluate(restored.intent.expression, entries).matches.map(entry => entry.id), ['dataset-catalog'])
})

test('a fresh page restores the same case study and empty-result plans from canonical links', () => {
  for (const query of ['case study Dataset Catalog', 'frontend AND Python', 'career timeline']) {
    const view = queryView('projects', query)
    assert.equal(view.intent.status, 'resolved')
    const restored = readView(viewSearch(view))
    assert.equal(restored.query, '')
    assert.deepEqual(restored.intent, view.intent)
    const result = evaluate(view.intent.expression, entries)
    assert.deepEqual(planInterface(restored.intent, evaluate(restored.intent.expression, entries)), planInterface(view.intent, result))
  }
})

test('rejects unknown predicates, IDs, syntax and arbitrary layout values', () => {
  for (const filter of ['id:unpublished', 'technology:unknown', 'or', 'kind:project,kind:experience', 'kind:project,', 'all,'.repeat(1100)]) {
    const params = new URLSearchParams({ view: 'decisions', filter, presentation: 'case-study' })
    assert.deepEqual(readView('?' + params), queryView('decisions'))
  }
  const view = queryView('projects', 'backend')
  view.intent.expression = { type: 'predicate', predicate: { field: 'id', value: 'unpublished' } }
  assert.equal(viewSearch(view), '')
  const search = '?view=projects&filter=category%3Abackend&presentation=unpublished&layout=constructor'
  assert.equal(viewSearch(readView(search)), '?filter=category%3Abackend')
})

test('unresolved queries retain text locally and serialize only the fallback goal', () => {
  for (const [query, status] of [['private marker @ example.invalid', 'unsupported'], ['projects OR experience', 'ambiguous']]) {
    const view = queryView('experience', query)
    assert.equal(view.intent.status, status)
    assert.equal(view.query, query)
    assert.equal(viewSearch(view), '?view=experience')
    assert.deepEqual(readView(viewSearch(view)), queryView('experience'))
  }
  const chosen = queryView('experience', 'projects OR experience', 'experience')
  assert.deepEqual(readView(viewSearch(chosen)).intent, chosen.intent)
})

function browserHistory(href = '/') {
  const stack = [{ url: new URL(href, 'https://portfolio.test'), state: null }]
  let index = 0
  function entry(url, state) {
    return { url: new URL(url, stack[index].url), state }
  }
  return {
    location: {
      get href() { return stack[index].url.href },
      get search() { return stack[index].url.search },
      get hash() { return stack[index].url.hash },
    },
    history: {
      get state() { return stack[index].state },
      get length() { return stack.length },
      pushState(state, _, url) {
        stack.splice(index + 1, stack.length, entry(url, state))
        index += 1
      },
      replaceState(state, _, url) { stack[index] = entry(url, state) },
      back() { index -= 1 },
      forward() { index += 1 },
    },
  }
}

test('Back and Forward restore local submissions that share a URL, including layout clarification', () => {
  const browser = browserHistory()
  const navigation = createNavigation(browser)
  const filtered = queryView('projects', 'Show your backend projects')
  const unsupported = queryView('projects', 'private marker')
  const ambiguous = queryView('projects', 'explore projects evaluate experience')
  const clarified = queryView('projects', ambiguous.query, 'projects')

  for (const view of [filtered, unsupported, ambiguous, clarified]) {
    navigation.navigate(view)
    assert.equal(browser.location.search, viewSearch(view))
  }
  assert.equal(browser.history.length, 5)
  assert.equal(browser.location.search, '')
  assert.deepEqual(Object.keys(browser.history.state), ['intentPortfolioKey'])
  assert.ok(!JSON.stringify(browser.history.state).includes(ambiguous.query))
  for (const view of [ambiguous, unsupported, filtered]) {
    browser.history.back()
    assert.deepEqual(navigation.restore(), view)
  }

  const refreshed = createNavigation(browser).restore()
  assert.equal(refreshed.query, '')
  assert.deepEqual(refreshed.intent, filtered.intent)
  for (const view of [unsupported, ambiguous, clarified]) {
    browser.history.forward()
    assert.deepEqual(navigation.restore(), view)
  }
})

test('legacy links are replaced in place and only validated filters survive reload', () => {
  const supported = browserHistory('/?q=Back-end+and+Postgres#results')
  const view = createNavigation(supported).restore()
  assert.equal(supported.history.length, 1)
  assert.equal(supported.location.search, viewSearch(view))
  assert.equal(supported.location.hash, '#results')
  assert.equal(view.query, 'Back-end and Postgres')
  assert.deepEqual(createNavigation(supported).restore().intent, view.intent)

  const rejected = browserHistory('/?view=experience&q=private+marker#private-marker')
  const result = createNavigation(rejected).restore()
  assert.equal(result.intent.status, 'unsupported')
  assert.equal(rejected.location.search, '?view=experience')
  assert.equal(rejected.location.hash, '')
  assert.deepEqual(createNavigation(rejected).restore(), queryView('experience'))

  const canonical = browserHistory('/?filter=category%3Abackend&q=private+marker#results')
  assert.equal(createNavigation(canonical).restore().query, '')
  assert.equal(canonical.location.search, '?filter=category%3Abackend')
})
