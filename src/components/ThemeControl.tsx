import { useEffect, useState } from 'react'

import { applyTheme, darkSchemeQuery, isThemePreference, persistTheme, watchSystemTheme, type ThemePreference } from '../state/theme.js'

export function ThemeControl() {
  const [preference, setPreference] = useState<ThemePreference>('system')

  useEffect(() => {
    const root = document.documentElement
    const bootPreference = root.dataset.themePreference
    if (isThemePreference(bootPreference)) setPreference(bootPreference)
    return watchSystemTheme(root, window.matchMedia(darkSchemeQuery))
  }, [])

  function selectTheme(value: string) {
    if (!isThemePreference(value)) return
    applyTheme(document.documentElement, value, window.matchMedia(darkSchemeQuery).matches)
    setPreference(value)
    try {
      persistTheme(window.localStorage, value)
    } catch {
      // The selected theme still works when browser storage is unavailable.
    }
  }

  return (
    <label className="theme-control">
      <span>Theme</span>
      <select value={preference} onChange={event => selectTheme(event.target.value)}>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  )
}
