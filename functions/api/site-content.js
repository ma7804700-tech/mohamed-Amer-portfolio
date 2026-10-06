import { isAuthorized, isSameOrigin, json } from '../_lib/admin.js'

const SECTION_ORDER = ['hero', 'work', 'services', 'about', 'process', 'contact']
const COLOR_KEYS = ['paper', 'ink', 'yellow', 'red', 'darkPaper', 'darkInk']
const MEDIA_KEYS = ['heroPortrait', 'aboutPortrait', 'ctaPortrait', 'heroVideo', 'heroPoster']
const LINK_KEYS = ['whatsappPrimary', 'whatsappSecondary', 'phone', 'emailPrimary', 'emailSecondary', 'telegram', 'linktree', 'instagram', 'youtube', 'linkedin']
const BRANDING_KEYS = ['name', 'monogram', 'siteDescription']
const CONTENT_PREFIXES = ['nav.', 'hero.', 'portfolio.', 'filter.', 'category.', 'services.', 'about.', 'process.', 'cta.', 'footer.', 'modal.']
const HEX_COLOR = /^#[\da-f]{6}$/i

function validTextMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const entries = Object.entries(value)
  return entries.length <= 300 && entries.every(([key, text]) =>
    CONTENT_PREFIXES.some((prefix) => key.startsWith(prefix)) &&
    typeof text === 'string' &&
    text.length <= 2000,
  )
}

function validStringFields(value, keys, limit) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.entries(value).length === keys.length &&
    keys.every((key) => typeof value[key] === 'string' && value[key].length <= limit)
}

function validMedia(value) {
  if (!validStringFields(value, MEDIA_KEYS, 2048)) return false
  return MEDIA_KEYS.every((key) => {
    const url = value[key]
    if (!url) return true
    if (url.startsWith('/')) return !url.startsWith('//') && !url.includes('\\')
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'https:' || parsed.protocol === 'http:'
    } catch {
      return false
    }
  })
}

function validLink(key, value) {
  if (!value) return true
  if (key === 'emailPrimary' || key === 'emailSecondary') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }
  try {
    const url = new URL(value)
    if (key === 'phone') return ['tel:', 'https:', 'http:'].includes(url.protocol)
    return ['https:', 'http:'].includes(url.protocol)
  } catch {
    return false
  }
}

function validateContent(content) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return 'Website settings are required.'
  if (!content.translations || !validTextMap(content.translations.en) || !validTextMap(content.translations.ar)) {
    return 'Website text must contain valid English and Arabic values.'
  }
  if (!content.colors || COLOR_KEYS.some((key) => !HEX_COLOR.test(content.colors[key] || ''))) {
    return 'Every website color must be a six-digit hex value.'
  }
  if (!Array.isArray(content.sectionOrder) || content.sectionOrder.length !== SECTION_ORDER.length ||
      new Set(content.sectionOrder).size !== SECTION_ORDER.length ||
      content.sectionOrder.some((section) => !SECTION_ORDER.includes(section))) {
    return 'The page section order is invalid.'
  }
  if (!validMedia(content.media)) return 'Media links must be valid local paths or HTTP/HTTPS URLs.'
  if (!validStringFields(content.links, LINK_KEYS, 2048)) return 'Contact links are invalid.'
  if (!content.branding || typeof content.branding !== 'object' ||
      Object.keys(content.branding).length !== BRANDING_KEYS.length ||
      BRANDING_KEYS.some((key) => typeof content.branding[key] !== 'string' ||
        content.branding[key].length > (key === 'siteDescription' ? 2000 : 80)) ||
      !content.branding.name.trim() || !content.branding.monogram.trim()) {
    return 'Enter a valid website name and monogram.'
  }
  if (LINK_KEYS.some((key) => !validLink(key, content.links[key]))) return 'Contact links must use a valid URL or email address.'
  return ''
}

export async function onRequestGet({ env }) {
  if (!env.PROJECTS_DB) return json({ error: 'Website storage is not configured.' }, 503)
  const row = await env.PROJECTS_DB.prepare(
    "SELECT content, updated_at FROM site_settings WHERE id = 'default'",
  ).first()
  if (!row) return json({ content: null })
  try {
    return json({ content: JSON.parse(row.content), updatedAt: row.updated_at })
  } catch {
    return json({ error: 'Saved website settings are invalid.' }, 500)
  }
}

export async function onRequestPut({ request, env }) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403)
  if (!env.PROJECTS_DB || !env.ADMIN_SESSION_SECRET) return json({ error: 'Website storage is not configured.' }, 503)
  if (!await isAuthorized(request, env.ADMIN_SESSION_SECRET, env.PROJECTS_DB)) return json({ error: 'Admin login required.' }, 401)

  const contentLength = Number(request.headers.get('Content-Length') || 0)
  if (contentLength > 96 * 1024) return json({ error: 'Website settings are too large.' }, 413)
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }

  const validationError = validateContent(body?.content)
  if (validationError) return json({ error: validationError }, 400)

  const serialized = JSON.stringify(body.content)
  if (serialized.length > 96 * 1024) return json({ error: 'Website settings are too large.' }, 413)
  await env.PROJECTS_DB.prepare(`
    INSERT INTO site_settings (id, content, updated_at)
    VALUES ('default', ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT(id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at
  `).bind(serialized).run()
  return json({ saved: true, content: body.content })
}
