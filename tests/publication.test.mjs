import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { publicEntries } from '../.test-build/data/public.js'
import { claims, relationships } from '../.test-build/evidence/approved.js'
import { buildCatalog, catalog, resolveBriefing } from '../.test-build/evidence/catalog.js'
import { dimensions, parsePlan, validatePlan } from '../.test-build/evidence/model.js'

test('publication excludes review, withdrawn and superseded records, even with familiar IDs', () => {
  const marker = 'synthetic-private-content'
  const result = buildCatalog(
    [...publicEntries, { ...publicEntries[0], title: marker, evidence: { status: 'draft', reference: marker } }],
    [...claims, ...['review','withdrawn','superseded'].map(status => ({ ...claims[0], title: marker, status }))],
    [...relationships, { ...relationships[0], interpretation: marker, status: 'review' }],
  )
  assert.deepEqual(result, catalog)
  assert.ok(!JSON.stringify(result).includes(marker))
})

test('publication rejects missing qualifications, invalid references and duplicate approved IDs', () => {
  for (const change of [{ limit: '' }, { source: { entryId: 'unlisted' } }, { classification: 'needs confirmation' }]) {
    assert.throws(() => buildCatalog(publicEntries, [{ ...claims[0], ...change }, ...claims.slice(1)], relationships))
  }
  const crossProjectSource = { ...claims[0], source: { entryId: 'synkrita-engineering-delivery' } }
  assert.throws(() => buildCatalog(publicEntries, [crossProjectSource, ...claims.slice(1)], relationships))
  assert.throws(() => buildCatalog(publicEntries, [...claims, claims[0]], relationships))
  assert.throws(() => buildCatalog(publicEntries, claims.slice(1), relationships))
})

test('optional claim details preserve existing IDs and reject unreviewed fields and invalid tags', () => {
  const { details, ...legacyClaim } = claims[0]
  const legacy = buildCatalog(publicEntries, [legacyClaim, ...claims.slice(1)], relationships)
  assert.equal(legacy.claims[0].id, claims[0].id)
  assert.equal(legacy.claims[0].details, undefined)
  for (const change of [
    { privateNote: 'unreviewed' },
    { details: { ...details, privateRepository: 'unreviewed' } },
    { details: { attribution: { scope: 'unknown' } } },
    { details: { attribution: { roles: ['unknown'] } } },
    { details: { validationContext: { internalRef: 'unreviewed' } } },
    { details: { revision: 0 } },
    { source: { ...claims[0].source, privateSource: 'unreviewed' } },
  ]) {
    assert.throws(() => buildCatalog(publicEntries, [{ ...claims[0], ...change }, ...claims.slice(1)], relationships))
  }
  assert.equal(catalog.claims.find(claim => claim.id === 'tohsa-integration').details.attribution.scope, 'collaborative')
  assert.equal(catalog.claims.find(claim => claim.id === 'ariadne-execution').details.attribution.aiAssisted, true)
  assert.ok(catalog.claims.every(claim => claim.source.type === 'candidate-published account'))
  assert.match(catalog.interpretationGuide.interpretation, /reason across any claims/)
  assert.match(catalog.interpretationGuide.extrapolation, /hypotheses/)
})

test('the flagship keeps its claim IDs while resolving all six comparison dimensions at stable URLs', () => {
  const views = catalog.briefings.filter(brief => brief.plan.operation === 'comparison')
  assert.deepEqual(views.map(brief => brief.plan.focus), [...dimensions])
  const ids = views[0].plan.components[0].claimIds
  const relation = relationships.find(item => item.id === views[0].plan.components[0].relationshipId)
  const contrasts = new Set()
  for (const { url, plan } of views) {
    assert.deepEqual(plan.components[0].claimIds, ids)
    assert.equal(resolveBriefing(url).url, url)
    assert.deepEqual(resolveBriefing(url + 'index.html').plan, plan)
    assert.deepEqual(parsePlan(JSON.stringify(plan), claims, relationships), plan)
    contrasts.add(relation.readings[plan.focus].contrast)
  }
  assert.equal(contrasts.size, views.length)
  assert.equal(resolveBriefing('/briefings/correctness/unknown/'), undefined)
})

test('the closed plan validator rejects freeform output and insufficient evidence', () => {
  const { plan } = catalog.briefings[0]
  const control = plan.components[0]
  for (const change of [
    { version: 2 }, { operation: 'custom' }, { focus: 'unknown' }, { url: '/extra' },
    { components: [control, control] },
    ...[{ type: 'script' }, { relationshipId: 'unlisted' }, { claimIds: ['unlisted'] }, { claimIds: [] }, { html: '<p>' }]
      .map(change => ({ components: [{ ...control, ...change }] })),
  ]) assert.equal(validatePlan({ ...plan, ...change }, claims, relationships), false)
  assert.equal(parsePlan(' '.repeat(8192) + JSON.stringify(plan), claims, relationships), undefined)
})

if (process.env.PAGES_VERIFY_DIST === '1') {
  const dist = new URL('../dist/', import.meta.url)
  const read = path => readFileSync(new URL('.' + path, dist), 'utf8')
  const htmlText = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#x27;')
  test('optional career records use the same dates and evidence anchors on both public views', () => {
    const payload = JSON.parse(read('/evidence.v1.json'))
    const schema = JSON.parse(read('/evidence-schema.v1.json'))
    const { career } = payload
    assert.ok(schema.properties.career)
    assert.ok(!schema.required.includes('career'))
    assert.equal(career.provenance, 'candidate-attested')
    assert.deepEqual(career.appointments.map(({ title, start, end }) => [title, start, end]), [
      ['Full-Stack Engineer', '2025-06', 'present'],
      ['Research Specialist', '2023-10', '2025-05'],
      ['Undergraduate Research Assistant', '2023-04', '2023-07'],
      ['Undergraduate Research Assistant', '2021-01', '2022-08'],
    ])
    assert.deepEqual(career.education.map(item => item.degree), ['M.S. in Computer Science', 'B.S. in Biomedical Engineering'])
    assert.deepEqual(career.skills.map(item => item.context), [
      'professional-engineering', 'professional-research', 'independent-project', 'undergraduate-research', 'academic',
    ])
    for (const path of ['/experience/index.html', '/resume/index.html']) {
      const html = read(path)
      for (const record of [...career.appointments, ...career.education, ...career.skills]) {
        assert.ok(html.includes('id="career-' + record.id + '"'))
        for (const link of record.evidence ?? []) {
          const [sourcePage, anchor] = link.url.split('#')
          const href = path.startsWith('/resume/') && sourcePage === '/experience/' ? '#' + anchor : link.url
          assert.ok(html.includes('href="' + href + '"'))
          assert.ok(read(sourcePage + 'index.html').includes('id="' + anchor + '"'))
        }
      }
      assert.ok(html.replaceAll('<!-- -->', '').includes('<time dateTime="2025-06">Jun 2025</time> – Present'))
      assert.match(html, /Candidate-attested career record/)
      assert.match(html, /Independent project/)
    }
    assert.equal(payload.claims.length, 17)
    assert.equal(payload.relationships.length, 4)
    assert.equal(payload.briefings.length, 9)
  })

  test('enriched claims resolve to concise case accounts without changing existing claim anchors', () => {
    const expected = {
      ariadne: ['ariadne-ambiguity', 'ariadne-execution', 'ariadne-evidence-eligibility', 'ariadne-discovery-cost',
        'ariadne-incomplete-upstream', 'ariadne-parity-gate'],
      synkrita: ['synkrita-transport-qualification', 'synkrita-connector-replay', 'synkrita-bounded-receipt',
        'synkrita-baseline-narrowing', 'synkrita-proposal-evaluation-gate', 'synkrita-release-reproducibility',
        'synkrita-operator-preparation', 'synkrita-tool-guidance'],
    }
    for (const [projectId, ids] of Object.entries(expected)) {
      const projectClaims = catalog.claims.filter(claim => claim.projectId === projectId)
      assert.deepEqual(projectClaims.map(claim => claim.id), ids)
      const project = catalog.projects.find(item => item.id === projectId)
      const html = read(project.url + 'index.html')
      assert.ok(html.includes('id="source-' + project.caseStudy.delivery.id + '"'))
      for (const claim of projectClaims) {
        assert.equal(claim.status, 'approved')
        assert.equal(claim.source.type, 'candidate-published account')
        assert.ok(html.includes('<details class="evidence-note" id="claim-' + claim.id + '">'))
        assert.ok(html.includes('id="' + claim.source.url.split('#')[1] + '"'))
      }
    }
    assert.equal(catalog.claims.find(claim => claim.id === 'ariadne-execution').source.entryId, 'ariadne-execution-boundary')
    assert.equal(catalog.claims.find(claim => claim.id === 'ariadne-ambiguity').source.entryId, 'ariadne-ambiguity')
    assert.equal(catalog.claims.find(claim => claim.id === 'synkrita-baseline-narrowing').source.entryId, 'synkrita-connector-baseline')
    const baseline = catalog.claims.find(claim => claim.id === 'synkrita-baseline-narrowing')
    assert.match(baseline.outcome, /14 in-process HTTP requests.*40.*212 HTTP attempts.*250.*four simulated reviews/)
    const synkrita = read('/projects/synkrita/index.html')
    assert.doesNotMatch(synkrita.split('<details class="evidence-note"')[0], /212 HTTP|14 in-process/)
    assert.match(catalog.claims.find(claim => claim.id === 'synkrita-proposal-evaluation-gate').outcome, /remains unrun/)
  })

  test('built evidence, navigation, semantic controls and limitations match the rendered pages', () => {
    const payload = JSON.parse(read('/evidence.v1.json'))
    assert.deepEqual(payload, JSON.parse(JSON.stringify(catalog)))
    assert.equal(JSON.parse(read('/evidence-schema.v1.json')).properties.version.const, 1)
    const home = read('/index.html')
    assert.match(home, /rel="alternate"[^>]*href="\/evidence\.v1\.json"/)
    assert.match(home, /<main[^>]*id="main"/)
    assert.match(home, /href="\/resume\/"/)
    for (const brief of payload.briefings) {
      const html = read(brief.url + 'index.html')
      assert.ok(html.includes('href="' + brief.url + '" aria-current="page"'))
      assert.match(html, /<summary>Interface Inspector<\/summary>/)
      for (const component of brief.plan.components) {
        const relationship = payload.relationships.find(item => item.id === component.relationshipId)
        assert.ok(html.includes(htmlText(relationship.readings[brief.plan.focus].contrast)))
        for (const id of component.claimIds) {
          const claim = payload.claims.find(item => item.id === id)
          assert.ok(html.includes(htmlText(claim.limit)))
          assert.ok(html.includes(claim.classification))
          assert.ok(html.includes('href="' + claim.source.url + '"'))
          const [path, anchor] = claim.source.url.split('#')
          assert.ok(read(path + 'index.html').includes('id="' + anchor + '"'))
        }
      }
    }
  })
}
