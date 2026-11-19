export const themePreferences = ['system', 'light', 'dark'] as const
export type ThemePreference = typeof themePreferences[number]

export const themeStorageKey = 'intent-portfolio:theme'
export const darkSchemeQuery = '(prefers-color-scheme: dark)'

export function isThemePreference(value: unknown): value is ThemePreference {
  return themePreferences.some(preference => preference === value)
}

export function applyTheme(root: HTMLElement, preference: ThemePreference, systemDark: boolean) {
  root.dataset.themePreference = preference
  root.dataset.theme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference
}

export function persistTheme(storage: Pick<Storage, 'setItem' | 'removeItem'>, preference: ThemePreference) {
  if (preference === 'system') storage.removeItem(themeStorageKey)
  else storage.setItem(themeStorageKey, preference)
}

export function watchSystemTheme(root: HTMLElement, scheme: MediaQueryList) {
  function sync() {
    if (root.dataset.themePreference === 'system') applyTheme(root, 'system', scheme.matches)
  }
  sync()
  scheme.addEventListener('change', sync)
  return () => scheme.removeEventListener('change', sync)
}
