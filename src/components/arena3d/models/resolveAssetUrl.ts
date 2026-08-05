export function resolveAssetUrl(registryPath: string): string {
  const raw = String(registryPath || '')
  if (!raw) return ''

  if (/^(data:|blob:|https?:|file:)/i.test(raw)) {
    return raw
  }

  let baseUrl = '/'
  try {
    baseUrl = String((import.meta as any).env?.BASE_URL || '/')
  } catch {
    baseUrl = '/'
  }
  const normalizedBase = baseUrl.replace(/\/+$/, '') + '/'

  if (raw.startsWith(normalizedBase)) {
    return raw
  }

  if (raw.startsWith('/')) {
    const cleanPath = raw.slice(1)
    const result = normalizedBase + cleanPath
    return result.replace(/\/+/g, '/')
  }

  const result = normalizedBase + raw
  return result.replace(/\/+/g, '/')
}
