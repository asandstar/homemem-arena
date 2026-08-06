import { BASE_URL } from '../../../utils/env'

export function resolveAssetUrl(registryPath: string): string {
  const raw = String(registryPath || '')
  if (!raw) return ''

  if (/^(data:|blob:|https?:|file:)/i.test(raw)) {
    return raw
  }

  const normalizedBase = BASE_URL.replace(/\/+$/, '') + '/'

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
