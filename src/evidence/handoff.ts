export interface PublicationInfo {
  origin?: string
  generatedAt?: string
}

export function publicOrigin(value?: string): string | undefined {
  if (!value) return
  try {
    const url = new URL(value)
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password &&
        url.pathname === '/' && !url.search && !url.hash) return url.origin
  } catch {
    return undefined
  }
}

export function evidenceUrl(path: string, canonicalOrigin?: string) {
  const origin = publicOrigin(canonicalOrigin)
  return origin ? new URL(path, origin).href : path
}
