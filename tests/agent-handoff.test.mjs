import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { catalog, evidencePath } from '../.test-build/evidence/catalog.js'
import { evidenceUrl, publicOrigin } from '../.test-build/evidence/handoff.js'

test('the shareable homepage uses the configured origin or a relative link', () => {
  const canonical = 'https://portfolio.example'
  assert.equal(evidenceUrl('/', canonical), canonical + '/')
  assert.equal(evidenceUrl('/'), '/')
  for (const invalid of ['javascript:void(0)', 'https://a.example/path', 'https://user@a.example', 'https://a.example/?x=1', 'null']) {
    assert.equal(publicOrigin(invalid), undefined)
    assert.equal(evidenceUrl('/', invalid), '/')
  }
})

if (process.env.PAGES_VERIFY_DIST === '1') {
  const read = path => readFileSync(new URL('../dist' + path, import.meta.url), 'utf8')
  test('onboarding links and attributed demonstration work in prerendered HTML', () => {
    const home = read('/index.html')
    assert.match(home, /href="\/experience\/"><strong>Evaluate my experience/)
    assert.match(home, /href="#questions"><strong>Explore engineering decisions/)
    assert.match(home, /href="\/bring-your-agent\/"><strong>Bring your AI agent/)
    const guide = read('/bring-your-agent/index.html')
    assert.match(home, /<link rel="alternate" type="application\/json"[^>]*href="\/evidence\.v1\.json"/)
    assert.match(home, /href="\/evidence\.v1\.json" type="application\/json">Public engineering evidence/)
    assert.match(guide, /Ask your AI about my engineering experience/)
    assert.match(guide, /Share the <a href="[^"]*\/">portfolio homepage<\/a>/)
    assert.match(guide, /Example questions/)
    assert.match(guide, /Website access and automatic evidence discovery vary by assistant/)
    assert.match(guide, /<details[^>]+><summary>See an example assessment<\/summary>/)
    assert.match(guide, /href="\/evidence-schema\.v1\.json">Schema<\/a>/)
    assert.match(guide, /<time dateTime="\d{4}-\d{2}-\d{2}T[^"]+">/)
    const main = guide.split('<main')[1].split('</main>')[0]
    assert.doesNotMatch(main, /<(button|form|select|textarea)\b|\sdownload(?:[=\s>])|Copy prompt|Copy evidence URL/)
    const payload = JSON.parse(read(evidencePath))
    assert.equal(JSON.parse(read(payload.presentation.documentation)).properties.version.const, payload.version)
    assert.match(guide, /Documented work.*Why it might apply.*Assumptions and uncertainty.*Ask in an interview/s)
    const demoClaimIds = ['analysis-performance', 'analysis-delivery', 'ariadne-ambiguity', 'ariadne-execution', 'tohsa-integration']
    for (const id of demoClaimIds) {
      const claim = payload.claims.find(item => item.id === id)
      assert.equal(claim.status, 'approved')
      assert.ok(guide.includes('href="' + claim.url + '"'))
      assert.ok(guide.includes('href="' + claim.source.url + '"'))
      assert.ok(guide.includes(claim.limit.replaceAll("'", "&#x27;")))
      assert.ok(guide.includes(claim.classification))
    }
    const mechanism = read('/how-it-works/index.html')
    assert.match(mechanism, /On this site.*With your assistant.*Share the homepage/s)
    assert.doesNotMatch(mechanism, /download it|URL or file/)
  })
}
