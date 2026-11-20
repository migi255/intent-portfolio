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
