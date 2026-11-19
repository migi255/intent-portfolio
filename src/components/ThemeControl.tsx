import { useEffect, useState } from 'react'

import { applyTheme, darkSchemeQuery, isThemePreference, persistTheme, watchSystemTheme, type ThemePreference } from '../state/theme'

export function ThemeControl() {
  const root = document.documentElement
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const bootPreference = root.dataset.themePreference
    return isThemePreference(bootPreference) ? bootPreference : 'system'
  })

  useEffect(() => watchSystemTheme(root, window.matchMedia(darkSchemeQuery)), [root])

  function selectTheme(value: string) {
    if (!isThemePreference(value)) return
    applyTheme(root, value, window.matchMedia(darkSchemeQuery).matches)
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
