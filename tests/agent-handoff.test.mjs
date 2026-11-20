import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { catalog, evidencePath } from '../.test-build/evidence/catalog.js'
import { agentPrompt, agentTasks, copyAgentPrompt, evidenceUrl, isAgentTask, publicOrigin } from '../.test-build/evidence/handoff.js'

test('evidence links use the canonical origin or the visitor origin and reject invalid origin values', () => {
  const canonical = 'https://portfolio.example'
  const current = 'https://preview.example'
  assert.equal(evidenceUrl(evidencePath, canonical, current), canonical + evidencePath)
  assert.equal(evidenceUrl(catalog.presentation.documentation, undefined, current), current + catalog.presentation.documentation)
  assert.equal(evidenceUrl(evidencePath), evidencePath)
  for (const invalid of ['javascript:void(0)', 'https://a.example/path', 'https://user@a.example', 'https://a.example/?x=1', 'null']) {
    assert.equal(publicOrigin(invalid), undefined)
    assert.equal(evidenceUrl(evidencePath, invalid, current), current + evidencePath)
  }
})

test('each task changes the instruction and keeps the common evidence requirements', () => {
  const url = evidenceUrl(evidencePath, 'https://portfolio.example')
  const general = agentPrompt(undefined, url)
  assert.match(general, /answer the question I provide/)
  assert.ok(general.includes(url))
  assert.match(general, /beyond the reviewed relationships/)
  assert.match(general, /future fit as a hypothesis/)
  assert.match(general, /Missing public evidence does not establish a lack of ability/)
  assert.equal(isAgentTask('unknown'), false)
  assert.equal(isAgentTask('constructor'), false)
  const prompts = Object.entries(agentTasks).map(([task, info]) => {
    const prompt = agentPrompt(task, url)
    assert.ok(prompt.startsWith(info.request))
    for (const requirement of [url, 'claim IDs', 'source anchors', 'collaborative work', 'plans',
      'classifications and limitations', 'supported accomplishments and metrics', 'does not establish', 'tools actually support']) {
      assert.ok(prompt.includes(requirement), requirement)
    }
    return prompt
  })
  assert.equal(new Set(prompts).size, 5)
})

test('clipboard writes the selected prompt and reports unavailable or denied access', async () => {
  const text = agentPrompt('interview', evidencePath)
  const written = []
  assert.equal(await copyAgentPrompt(text, async value => { written.push(value) }), true)
  assert.deepEqual(written, [text])
  assert.equal(await copyAgentPrompt(text), false)
  assert.equal(await copyAgentPrompt(text, async () => { throw new Error('denied') }), false)
})

if (process.env.PAGES_VERIFY_DIST === '1') {
  const read = path => readFileSync(new URL('../dist' + path, import.meta.url), 'utf8')
  test('onboarding links and attributed demonstration work in prerendered HTML', () => {
    const home = read('/index.html')
    assert.match(home, /href="\/experience\/"><strong>Evaluate my experience/)
    assert.match(home, /href="#questions"><strong>Explore engineering decisions/)
    assert.match(home, /href="\/bring-your-agent\/"><strong>Bring your AI agent/)
    const guide = read('/bring-your-agent/index.html')
    assert.match(guide, /Schema version 1/)
    assert.match(guide, /<time dateTime="\d{4}-\d{2}-\d{2}T[^"]+">/)
    assert.match(home, /href="\/evidence\.v1\.json" type="application\/json">Public engineering evidence/)
    assert.match(guide, /Share a URL and ask your own question/)
    assert.match(guide, /<details[^>]+><summary>Optional instructions and example questions/)
    assert.match(guide, /<option value="" selected="">Bring your own question/)
    assert.match(guide, /<label for="agent-task">Task/)
    assert.match(guide, /<label for="agent-prompt">Prompt to paste/)
    assert.match(guide, /role="status"/)
    assert.match(guide, /<noscript>/)
    assert.doesNotMatch(guide, /<form|type="submit"/)
    const payload = JSON.parse(read(evidencePath))
    assert.equal(JSON.parse(read(payload.presentation.documentation)).properties.version.const, payload.version)
    assert.match(guide, /Documented work.*Why it might apply.*Assumptions and uncertainty.*Ask in an interview/s)
    for (const claim of payload.claims) {
      assert.equal(claim.status, 'approved')
      assert.ok(guide.includes('href="' + claim.url + '"'))
      assert.ok(guide.includes('href="' + claim.source.url + '"'))
      assert.ok(guide.includes(claim.limit.replaceAll("'", "&#x27;")))
      assert.ok(guide.includes(claim.classification))
    }
    assert.match(read('/how-it-works/index.html'), /On this site.*With your assistant/s)
  })
}
