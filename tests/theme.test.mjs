import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

import {
  applyTheme, darkSchemeQuery, isThemePreference, persistTheme, themeStorageKey, watchSystemTheme,
} from '../.test-build/state/theme.js'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const bootstrap = html.match(/<script id="theme-bootstrap">([\s\S]*?)<\/script>/)?.[1]

function loadTheme(stored, systemDark) {
  const root = { dataset: {} }
  runInNewContext(bootstrap, {
    document: { documentElement: root },
    localStorage: {
      getItem(key) {
        assert.equal(key, themeStorageKey)
        if (stored instanceof Error) throw stored
        return stored
      },
    },
    matchMedia(query) {
      assert.equal(query, darkSchemeQuery)
      return { matches: systemDark }
    },
  })
  return root
}

test('early theme bootstrap applies manual settings and defaults invalid or blocked storage to the OS', () => {
  assert.ok(bootstrap)
  for (const [stored, systemDark, preference, theme] of [
    ['dark', false, 'dark', 'dark'],
    ['light', true, 'light', 'light'],
    [null, true, 'system', 'dark'],
    ['unexpected', false, 'system', 'light'],
    [new Error('storage blocked'), true, 'system', 'dark'],
  ]) {
    assert.deepEqual(loadTheme(stored, systemDark).dataset, { themePreference: preference, theme })
  }
})

test('theme persistence accepts manual choices and clears the override in System mode', () => {
  const values = new Map()
  const storage = { setItem: values.set.bind(values), removeItem: values.delete.bind(values) }
  for (const preference of ['light', 'dark']) {
    assert.equal(isThemePreference(preference), true)
    persistTheme(storage, preference)
    assert.equal(values.get(themeStorageKey), preference)
  }
  assert.equal(isThemePreference('constructor'), false)
  persistTheme(storage, 'system')
  assert.equal(values.has(themeStorageKey), false)
})

test('OS changes affect System mode and leave manual choices selected', () => {
  const root = loadTheme(null, false)
  const listeners = new Set()
  const scheme = {
    matches: true,
    addEventListener(event, listener) {
      assert.equal(event, 'change')
      listeners.add(listener)
    },
    removeEventListener(event, listener) {
      assert.equal(event, 'change')
      listeners.delete(listener)
    },
  }
  const stop = watchSystemTheme(root, scheme)
  assert.equal(root.dataset.theme, 'dark')
  function setSystemDark(dark) {
    scheme.matches = dark
    for (const listener of listeners) listener()
  }
  setSystemDark(false)
  assert.equal(root.dataset.theme, 'light')
  applyTheme(root, 'light', scheme.matches)
  setSystemDark(true)
  assert.equal(root.dataset.theme, 'light')
  applyTheme(root, 'system', scheme.matches)
  assert.equal(root.dataset.theme, 'dark')
  stop()
  assert.equal(listeners.size, 0)
})
