import { isAuthorized, isSameOrigin, json } from '../_lib/admin.js'

const CATEGORIES = new Set(['Promo', 'Reels', 'Long-form', 'Motion Graphics', 'AI Workflows'])
const URL_LIMIT = 2048
const BUILT_IN_PROJECT_IDS = new Set(Array.from({ length: 32 }, (_, index) => String(index + 1).padStart(2, '0')))

function normalizeProject(row) {
  const url = new URL(row.url)
  const isDriveUrl = ['drive.google.com', 'docs.google.com', 'drive.usercontent.google.com'].includes(url.hostname)
  const driveMatch = isDriveUrl ? url.pathname.match(/\/file\/d\/([\w-]+)/) : null
  const driveId = isDriveUrl ? driveMatch?.[1] || url.searchParams.get('id') || '' : ''
  return {
    id: row.id,
    title: row.title,
    externalUrl: row.url,
    driveFileId: /^[\w-]{10,}$/.test(driveId) ? driveId : '',
    category: row.category,
    description: row.description,
    addedAt: row.created_at.slice(0, 10),
  }
}

export async function onRequestGet({ env }) {
  if (!env.PROJECTS_DB) return json({ error: 'Project storage is not configured.' }, 503)
  const [projectRows, overrideRows, orderRows] = await Promise.all([
    env.PROJECTS_DB.prepare(
    'SELECT id, title, url, category, description, created_at FROM projects ORDER BY created_at DESC',
    ).all(),
    env.PROJECTS_DB.prepare('SELECT project_id AS id, title, category, description FROM project_overrides').all(),
    env.PROJECTS_DB.prepare('SELECT project_id AS id, position FROM project_order ORDER BY position').all(),
  ])
  return json({
    projects: projectRows.results.map(normalizeProject),
    overrides: overrideRows.results,
    order: orderRows.results.map((row) => row.id),
  })
}

export async function onRequestPost({ request, env }) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403)
  if (!env.PROJECTS_DB || !env.ADMIN_SESSION_SECRET) return json({ error: 'Project storage is not configured.' }, 503)
  if (!await isAuthorized(request, env.ADMIN_SESSION_SECRET)) return json({ error: 'Admin login required.' }, 401)

  const contentLength = Number(request.headers.get('Content-Length') || 0)
  if (contentLength > 8192) return json({ error: 'Request body is too large.' }, 413)
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }

  if (!body || typeof body !== 'object') return json({ error: 'Project details are required.' }, 400)
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const category = typeof body.category === 'string' ? body.category : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const rawUrl = typeof body.url === 'string' ? body.url.trim() : ''
  if (!title || title.length > 100) return json({ error: 'Project title must be 1–100 characters.' }, 400)
  if (!CATEGORIES.has(category)) return json({ error: 'Choose a valid project category.' }, 400)
  if (description.length > 600) return json({ error: 'Description must be 600 characters or fewer.' }, 400)
  if (!rawUrl || rawUrl.length > URL_LIMIT) return json({ error: 'Enter a link up to 2048 characters.' }, 400)

  let url
  try {
    url = new URL(rawUrl)
  } catch {
    return json({ error: 'Enter a valid link beginning with https://.' }, 400)
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    return json({ error: 'Only public HTTP or HTTPS links are allowed.' }, 400)
  }

  const id = crypto.randomUUID()
  await env.PROJECTS_DB.batch([
    env.PROJECTS_DB.prepare('UPDATE project_order SET position = position + 1000000'),
    env.PROJECTS_DB.prepare('UPDATE project_order SET position = position - 999999'),
    env.PROJECTS_DB.prepare('INSERT INTO project_order (project_id, position) VALUES (?, 0)').bind(id),
    env.PROJECTS_DB.prepare(
    'INSERT INTO projects (id, title, url, category, description) VALUES (?, ?, ?, ?, ?)',
    ).bind(id, title, url.href, category, description),
  ])
  const saved = await env.PROJECTS_DB.prepare(
    'SELECT id, title, url, category, description, created_at FROM projects WHERE id = ?',
  ).bind(id).first()
  return json({ project: normalizeProject(saved) }, 201)
}

export async function onRequestPatch({ request, env }) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403)
  if (!env.PROJECTS_DB || !env.ADMIN_SESSION_SECRET) return json({ error: 'Project storage is not configured.' }, 503)
  if (!await isAuthorized(request, env.ADMIN_SESSION_SECRET)) return json({ error: 'Admin login required.' }, 401)

  const contentLength = Number(request.headers.get('Content-Length') || 0)
  if (contentLength > 32768) return json({ error: 'Request body is too large.' }, 413)
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }
  if (!body || typeof body !== 'object' || !Array.isArray(body.order) || !Array.isArray(body.updates)) {
    return json({ error: 'Project order and updates are required.' }, 400)
  }
  if (body.order.length > 200 || body.updates.length > 200) return json({ error: 'Too many projects in one request.' }, 400)

  const uniqueOrder = new Set(body.order)
  if (uniqueOrder.size !== body.order.length || body.order.some((id) => typeof id !== 'string' || id.length > 64)) {
    return json({ error: 'Project order contains invalid or repeated IDs.' }, 400)
  }

  const customRows = await env.PROJECTS_DB.prepare('SELECT id FROM projects').all()
  const allowedIds = new Set([...BUILT_IN_PROJECT_IDS, ...customRows.results.map((row) => row.id)])
  if (body.order.some((id) => !allowedIds.has(id)) || [...allowedIds].some((id) => !uniqueOrder.has(id))) {
    return json({ error: 'Project order must contain every project exactly once.' }, 400)
  }

  const statements = [
    env.PROJECTS_DB.prepare('UPDATE project_order SET position = position + 1000000'),
    ...body.order.map((id, position) =>
    env.PROJECTS_DB.prepare(
      'INSERT INTO project_order (project_id, position) VALUES (?, ?) ON CONFLICT(project_id) DO UPDATE SET position = excluded.position',
    ).bind(id, position),
    ),
  ]

  const seenUpdates = new Set()
  for (const update of body.updates) {
    if (!update || typeof update !== 'object' || typeof update.id !== 'string' || !allowedIds.has(update.id) || seenUpdates.has(update.id)) {
      return json({ error: 'Project changes contain an invalid or repeated project.' }, 400)
    }
    const title = typeof update.title === 'string' ? update.title.trim() : ''
    const category = typeof update.category === 'string' ? update.category : ''
    const description = typeof update.description === 'string' ? update.description.trim() : ''
    if (!title || title.length > 100) return json({ error: 'Project title must be 1–100 characters.' }, 400)
    if (!CATEGORIES.has(category)) return json({ error: 'Choose a valid project category.' }, 400)
    if (description.length > 600) return json({ error: 'Description must be 600 characters or fewer.' }, 400)
    seenUpdates.add(update.id)

    if (BUILT_IN_PROJECT_IDS.has(update.id)) {
      statements.push(env.PROJECTS_DB.prepare(`
        INSERT INTO project_overrides (project_id, title, category, description)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(project_id) DO UPDATE SET
          title = excluded.title,
          category = excluded.category,
          description = excluded.description
      `).bind(update.id, title, category, description))
    } else {
      statements.push(env.PROJECTS_DB.prepare(
        'UPDATE projects SET title = ?, category = ?, description = ? WHERE id = ?',
      ).bind(title, category, description, update.id))
    }
  }

  await env.PROJECTS_DB.batch(statements)
  return json({ saved: true })
}

export async function onRequestDelete({ request, env }) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403)
  if (!env.PROJECTS_DB || !env.ADMIN_SESSION_SECRET) return json({ error: 'Project storage is not configured.' }, 503)
  if (!await isAuthorized(request, env.ADMIN_SESSION_SECRET)) return json({ error: 'Admin login required.' }, 401)

  const id = new URL(request.url).searchParams.get('id')
  if (!id || id.length > 64) return json({ error: 'Choose a valid project.' }, 400)
  const result = await env.PROJECTS_DB.batch([
    env.PROJECTS_DB.prepare('DELETE FROM projects WHERE id = ?').bind(id),
    env.PROJECTS_DB.prepare('DELETE FROM project_order WHERE project_id = ?').bind(id),
  ])
  if (result[0].meta.changes === 0) return json({ error: 'Project not found.' }, 404)
  return json({ deleted: true })
}
