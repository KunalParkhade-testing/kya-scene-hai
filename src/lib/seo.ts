export const SITE_URL = 'https://kya-scene-hai.vercel.app'
export const SITE_NAME = 'Kya Scene Hai?'
export const DEFAULT_DESCRIPTION = 'Curious about what’s happening — and why? Explore stories, systems, culture and ideas shaping the world, starting with India.'

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString()
}

export function plainText(value: string | null | undefined) {
  if (!value) return ''
  return value
    .replace(/^__TIPTAP_JSON__:/, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`=#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isSafeArticleLink(value: string) {
  try {
    const url = new URL(value, SITE_URL)
    if (/^https?:\/\//i.test(value)) return url.protocol === 'http:' || url.protocol === 'https:'
    if (!value.startsWith('/') || value.startsWith('//')) return false
    return url.origin === new URL(SITE_URL).origin
  } catch {
    return false
  }
}
