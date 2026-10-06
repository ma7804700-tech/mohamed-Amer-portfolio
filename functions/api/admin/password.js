import {
  clearSession,
  hashAdminPassword,
  isAuthorized,
  json,
  matchesPassword,
  matchesStoredPassword,
} from '../../_lib/admin.js'

async function readBody(request) {
  if (Number(request.headers.get('Content-Length') || 0) > 4096) return { error: 'too-large' }
  let raw
  try {
    raw = await request.text()
  } catch {
    return { error: 'invalid' }
  }
  if (new TextEncoder().encode(raw).byteLength > 4096) return { error: 'too-large' }
  try {
    return { body: JSON.parse(raw) }
  } catch {
    return { error: 'invalid' }
  }
}

export async function onRequestPost({ request, env }) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return json({ error: 'Invalid request origin.' }, 403)
  }
  if (!env.PROJECTS_DB || !env.ADMIN_SESSION_SECRET || !env.ADMIN_PASSWORD) {
    return json({ error: 'Admin password changes are not configured.' }, 503)
  }
  if (!await isAuthorized(request, env.ADMIN_SESSION_SECRET, env.PROJECTS_DB)) {
    return json({ error: 'Admin login required.' }, 401)
  }

  const parsed = await readBody(request)
  if (parsed.error === 'too-large') return json({ error: 'Request body is too large.' }, 413)
  if (parsed.error || !parsed.body || typeof parsed.body !== 'object' || Array.isArray(parsed.body)) {
    return json({ error: 'Invalid request body.' }, 400)
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.body
  if (typeof currentPassword !== 'string' || currentPassword.length > 128 ||
      typeof newPassword !== 'string' || newPassword.length < 12 || newPassword.length > 128 ||
      typeof confirmPassword !== 'string' || confirmPassword.length > 128) {
    return json({ error: 'Enter the current password and a new password of at least 12 characters.' }, 400)
  }
  if (newPassword !== confirmPassword) return json({ error: 'The new passwords do not match.' }, 400)
  if (currentPassword === newPassword) return json({ error: 'Choose a new password different from the current one.' }, 400)

  const storedPassword = await env.PROJECTS_DB.prepare(
    "SELECT password_salt, password_hash, updated_at FROM admin_passwords WHERE id = 'default'",
  ).first()
  const validCurrentPassword = storedPassword
    ? await matchesStoredPassword(currentPassword, storedPassword.password_salt, storedPassword.password_hash)
    : await matchesPassword(currentPassword, env.ADMIN_PASSWORD)

  if (!validCurrentPassword) return json({ error: 'The current password is incorrect.' }, 401)

  const nextPassword = await hashAdminPassword(newPassword)
  const updatedAt = Math.max(Date.now(), (storedPassword?.updated_at || 0) + 1)
  const savedPassword = storedPassword
    ? await env.PROJECTS_DB.prepare(`
        UPDATE admin_passwords
        SET password_salt = ?, password_hash = ?, updated_at = ?
        WHERE id = 'default' AND updated_at = ? AND password_salt = ? AND password_hash = ?
        RETURNING id
      `).bind(
        nextPassword.salt,
        nextPassword.hash,
        updatedAt,
        storedPassword.updated_at,
        storedPassword.password_salt,
        storedPassword.password_hash,
      ).first()
    : await env.PROJECTS_DB.prepare(`
        INSERT INTO admin_passwords (id, password_salt, password_hash, updated_at)
        VALUES ('default', ?, ?, ?)
        ON CONFLICT(id) DO NOTHING
        RETURNING id
      `).bind(nextPassword.salt, nextPassword.hash, updatedAt).first()

  if (!savedPassword) return json({ error: 'The password changed in another request. Sign in again before retrying.' }, 409)

  return json({ changed: true }, 200, { 'Set-Cookie': clearSession(request) })
}
