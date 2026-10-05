import { clearSession, createSession, hashClientIp, isAuthorized, isSameOrigin, json, matchesPassword } from '../../_lib/admin.js'

const MAX_ATTEMPTS = 5
const WINDOW_SECONDS = 15 * 60

async function checkLoginLimit(db, ip) {
  const row = await db.prepare('SELECT attempts, window_started FROM login_attempts WHERE ip = ?').bind(ip).first()
  if (!row || Math.floor(Date.now() / 1000) - row.window_started >= WINDOW_SECONDS) return false
  return row.attempts >= MAX_ATTEMPTS
}

async function recordFailedAttempt(db, ip) {
  const now = Math.floor(Date.now() / 1000)
  await db.prepare(`
    INSERT INTO login_attempts (ip, attempts, window_started)
    VALUES (?, 1, ?)
    ON CONFLICT(ip) DO UPDATE SET
      attempts = CASE
        WHEN excluded.window_started - login_attempts.window_started >= ? THEN 1
        ELSE login_attempts.attempts + 1
      END,
      window_started = CASE
        WHEN excluded.window_started - login_attempts.window_started >= ? THEN excluded.window_started
        ELSE login_attempts.window_started
      END
  `).bind(ip, now, WINDOW_SECONDS, WINDOW_SECONDS).run()
}

export async function onRequestGet({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) return json({ error: 'Admin access is not configured.' }, 503)
  return json({ authenticated: await isAuthorized(request, env.ADMIN_SESSION_SECRET) })
}

export async function onRequestPost({ request, env }) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403)
  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET || !env.PROJECTS_DB) return json({ error: 'Admin access is not configured.' }, 503)

  const ip = await hashClientIp(request.headers.get('CF-Connecting-IP') || 'unknown', env.ADMIN_SESSION_SECRET)
  if (await checkLoginLimit(env.PROJECTS_DB, ip)) return json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429)

  let body
  const contentLength = Number(request.headers.get('Content-Length') || 0)
  if (contentLength > 2048) return json({ error: 'Request body is too large.' }, 413)
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }
  if (!body || typeof body !== 'object' || typeof body.password !== 'string' || body.password.length > 128) {
    await recordFailedAttempt(env.PROJECTS_DB, ip)
    return json({ error: 'Incorrect password.' }, 401)
  }

  if (!await matchesPassword(body.password, env.ADMIN_PASSWORD)) {
    await recordFailedAttempt(env.PROJECTS_DB, ip)
    return json({ error: 'Incorrect password.' }, 401)
  }

  await env.PROJECTS_DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run()
  return json({ authenticated: true }, 200, { 'Set-Cookie': await createSession(env.ADMIN_SESSION_SECRET, request) })
}

export async function onRequestDelete({ request }) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403)
  return json({ authenticated: false }, 200, { 'Set-Cookie': clearSession(request) })
}
