import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const sourceHeaders = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8')
const sourceHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const beacon = 'https://static.cloudflareinsights.com/beacon.min.js'

function parseHeaders(file) {
  const [route, ...lines] = file.trimEnd().split(/\r?\n/)
  assert.equal(route, '/*')

  const headers = new Map()
  for (const line of lines) {
    assert.ok(line.length <= 2000, 'Pages limits each header line to 2,000 characters')
    const match = /^  ([A-Za-z-]+): (\S.*)$/.exec(line)
    assert.ok(match, 'Expected an indented HTTP header')
    const [, name, value] = match
    const key = name.toLowerCase()
    assert.ok(!headers.has(key), 'Duplicate header: ' + name)
    headers.set(key, value)
  }
  return headers
}

function parsePolicy(headers) {
  const value = headers.get('content-security-policy-report-only')
  assert.ok(value, 'Expected a report-only policy')
  const directives = new Map()
  for (const directive of value.split(';')) {
    const [name, ...sources] = directive.trim().split(/\s+/)
    assert.match(name, /^[a-z-]+$/)
    assert.ok(sources.length && !directives.has(name), 'Missing sources or duplicate directive: ' + name)
    directives.set(name, sources)
  }
  return directives
}

function checkScriptSources(policy, html) {
  const scripts = [...html.replace(/\r\n?/g, '\n').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  assert.ok(scripts.length >= 2, 'Expected the theme bootstrap and application entry')

  const inline = []
  for (const [, attributes, body] of scripts) {
    const external = /(?:^|\s)src="([^"]+)"/i.exec(attributes)
    if (external) {
      assert.match(external[1], /^\/(?!\/)/, 'Application scripts must be same-origin')
    } else {
      assert.match(attributes, /(?:^|\s)id="theme-bootstrap"/)
      inline.push(body)
    }
  }
  assert.equal(inline.length, 1, 'Expected only the theme bootstrap to be inline')
  const hash = createHash('sha256').update(inline[0], 'utf8').digest('base64')
  assert.deepEqual(policy.get('script-src'), ["'self'", "'sha256-" + hash + "'", beacon, beacon + '/'])
}

test('Pages uses one global rule with framing, referrer, MIME, and permission protections', () => {
  const headers = parseHeaders(sourceHeaders)
  assert.deepEqual([...headers.keys()].sort(), [
    'content-security-policy-report-only', 'permissions-policy', 'referrer-policy',
    'x-content-type-options', 'x-frame-options',
  ])
  assert.equal(headers.get('x-content-type-options'), 'nosniff')
  assert.equal(headers.get('referrer-policy'), 'no-referrer')
  assert.equal(headers.get('x-frame-options'), 'DENY')
  assert.equal(headers.get('permissions-policy'), 'camera=(), geolocation=(), microphone=(), payment=()')
})

test('CSP uses report-only mode, limits connections to the same origin, and denies unused resource types', () => {
  const policy = parsePolicy(parseHeaders(sourceHeaders))
  const expected = {
    'default-src': ["'none'"],
    'style-src': ["'self'"],
    'img-src': ["'self'"],
    'connect-src': ["'self'"],
    'object-src': ["'none'"],
    'frame-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'none'"],
    'worker-src': ["'none'"],
  }
  assert.deepEqual(Object.fromEntries([...policy].filter(([name]) => name !== 'script-src')), expected)
})

test('script-src allows the exact theme bootstrap hash and the Cloudflare beacon paths', () => {
  checkScriptSources(parsePolicy(parseHeaders(sourceHeaders)), sourceHtml)
})

if (process.env.PAGES_VERIFY_DIST === '1') {
  test('Vite copies the headers verbatim and preserves script compatibility in the built HTML', () => {
    const builtHeaders = readFileSync(new URL('../dist/_headers', import.meta.url), 'utf8')
    const builtHtml = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8')
    assert.equal(builtHeaders, sourceHeaders)
    checkScriptSources(parsePolicy(parseHeaders(builtHeaders)), builtHtml)
  })
}
