import { clearSession, hashAdminPassword, hashClientIp, json, secureHashEqual } from '../../_lib/admin.js'

const CODE_TTL_SECONDS = 5 * 60
const MAX_CODE_ATTEMPTS = 5
const MAX_SENDS_PER_HOUR = 3
const SEND_COOLDOWN_SECONDS = 60

function generateCode() {
  const values = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / 900000) * 900000
  let value
  do {
    crypto.getRandomValues(values)
    value = values[0]
  } while (value >= limit)
  return String(100000 + (value % 900000))
}

async function consumeSendLimit(db, bucket, now) {
  return db.prepare(`
    INSERT INTO admin_recovery_rate_limits (bucket, sent_count, window_started, last_sent_at)
    VALUES (?, 1, ?, ?)
    ON CONFLICT(bucket) DO UPDATE SET
      sent_count = CASE
        WHEN excluded.last_sent_at - admin_recovery_rate_limits.window_started >= 3600 THEN 1
        ELSE admin_recovery_rate_limits.sent_count + 1
      END,
      window_started = CASE
        WHEN excluded.last_sent_at - admin_recovery_rate_limits.window_started >= 3600 THEN excluded.last_sent_at
        ELSE admin_recovery_rate_limits.window_started
      END,
      last_sent_at = excluded.last_sent_at
    WHERE (
      excluded.last_sent_at - admin_recovery_rate_limits.window_started >= 3600 OR
      admin_recovery_rate_limits.sent_count < ?
    ) AND excluded.last_sent_at - admin_recovery_rate_limits.last_sent_at >= ?
    RETURNING sent_count
  `).bind(bucket, now, now, MAX_SENDS_PER_HOUR, SEND_COOLDOWN_SECONDS).first()
}

function validWhatsAppConfig(env) {
  const version = env.WHATSAPP_GRAPH_API_VERSION
  return typeof env.WHATSAPP_ACCESS_TOKEN === 'string' &&
    env.WHATSAPP_ACCESS_TOKEN.length > 0 &&
    /^\d{5,30}$/.test(env.WHATSAPP_PHONE_NUMBER_ID || '') &&
    /^\d{8,15}$/.test(env.WHATSAPP_RECOVERY_NUMBER || '') &&
    /^[a-z0-9_]{1,512}$/.test(env.WHATSAPP_RECOVERY_TEMPLATE || '') &&
    /^[a-z]{2}(?:_[A-Z]{2})?$/.test(env.WHATSAPP_RECOVERY_LANGUAGE || 'ar') &&
    /^v\d+\.\d+$/.test(version || '')
}

async function readBody(request) {
  if (Number(request.headers.get('Content-Length') || 0) > 2048) return { error: 'too-large' }
  let raw
  try {
    raw = await request.text()
  } catch {
    return { error: 'invalid' }
  }
  if (new TextEncoder().encode(raw).byteLength > 2048) return { error: 'too-large' }
  try {
    return { body: JSON.parse(raw) }
  } catch {
    return { error: 'invalid' }
  }
}

export async function onRequestPost({ request, env }) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) return json({ error: 'Invalid request origin.' }, 403)
  if (!env.PROJECTS_DB || !env.ADMIN_SESSION_SECRET) return json({ error: 'Password recovery is not configured.' }, 503)
  if (!validWhatsAppConfig(env)) return json({ error: 'WhatsApp password recovery is not configured yet.' }, 503)

  const parsed = await readBody(request)
  if (parsed.error === 'too-large') return json({ error: 'Request body is too large.' }, 413)
  if (parsed.error || !parsed.body || typeof parsed.body !== 'object' || Array.isArray(parsed.body)) {
    return json({ error: 'Invalid request body.' }, 400)
  }
  const { body } = parsed
  const now = Math.floor(Date.now() / 1000)

  if (body.action === 'request-code') {
    const ip = await hashClientIp(request.headers.get('CF-Connecting-IP') || 'unknown', env.ADMIN_SESSION_SECRET)
    await env.PROJECTS_DB.prepare(
      "DELETE FROM admin_recovery_rate_limits WHERE bucket != 'global' AND last_sent_at < ?",
    ).bind(now - 86400).run()
    const ipLimit = await consumeSendLimit(env.PROJECTS_DB, `ip:${ip}`, now)
    const globalLimit = ipLimit && await consumeSendLimit(env.PROJECTS_DB, 'global', now)
    if (!ipLimit || !globalLimit) return json({ error: 'A code was requested recently. Please wait before trying again.' }, 429)

    const code = generateCode()
    const codeHash = await hashClientIp(code, env.ADMIN_SESSION_SECRET)
    await env.PROJECTS_DB.prepare(`
      INSERT INTO admin_recovery_challenges (id, code_hash, expires_at, attempts, created_at)
      VALUES ('default', ?, ?, 0, ?)
      ON CONFLICT(id) DO UPDATE SET
        code_hash = excluded.code_hash,
        expires_at = excluded.expires_at,
        attempts = 0,
        created_at = excluded.created_at
    `).bind(codeHash, now + CODE_TTL_SECONDS, now).run()

    let delivery
    try {
      delivery = await fetch(
        `https://graph.facebook.com/${env.WHATSAPP_GRAPH_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: env.WHATSAPP_RECOVERY_NUMBER,
            type: 'template',
            template: {
              name: env.WHATSAPP_RECOVERY_TEMPLATE,
              language: { code: env.WHATSAPP_RECOVERY_LANGUAGE || 'ar' },
              components: [{
                type: 'body',
                parameters: [{ type: 'text', text: code }],
              }],
            },
          }),
        },
      )
    } catch (error) {
      await env.PROJECTS_DB.prepare("DELETE FROM admin_recovery_challenges WHERE id = 'default'").run()
      console.error('WhatsApp recovery message could not be sent:', error)
      return json({ error: 'WhatsApp could not send the recovery code. Check the WhatsApp API configuration.' }, 502)
    }

    if (!delivery.ok) {
      await env.PROJECTS_DB.prepare("DELETE FROM admin_recovery_challenges WHERE id = 'default'").run()
      console.error('WhatsApp recovery message was rejected with status:', delivery.status)
      return json({ error: 'WhatsApp rejected the recovery message. Check the approved template and API settings.' }, 502)
    }

    return json({ sent: true, expiresIn: CODE_TTL_SECONDS })
  }

  if (body.action === 'reset-password') {
    if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) {
      return json({ error: 'Enter the six-digit code sent to WhatsApp.' }, 400)
    }
    if (typeof body.newPassword !== 'string' || body.newPassword.length < 12 || body.newPassword.length > 128) {
      return json({ error: 'The new password must be 12 to 128 characters long.' }, 400)
    }

    const challenge = await env.PROJECTS_DB.prepare(
      "SELECT code_hash, expires_at, attempts FROM admin_recovery_challenges WHERE id = 'default'",
    ).first()
    if (!challenge || challenge.expires_at <= now) {
      await env.PROJECTS_DB.prepare("DELETE FROM admin_recovery_challenges WHERE id = 'default'").run()
      return json({ error: 'The verification code has expired. Request a new one.' }, 400)
    }
    if (challenge.attempts >= MAX_CODE_ATTEMPTS) {
      await env.PROJECTS_DB.prepare("DELETE FROM admin_recovery_challenges WHERE id = 'default'").run()
      return json({ error: 'Too many incorrect codes. Request a new one.' }, 429)
    }

    const suppliedHash = await hashClientIp(body.code, env.ADMIN_SESSION_SECRET)
    if (!secureHashEqual(challenge.code_hash, suppliedHash)) {
      const attempt = await env.PROJECTS_DB.prepare(`
        UPDATE admin_recovery_challenges
        SET attempts = attempts + 1
        WHERE id = 'default' AND expires_at > ? AND attempts < ?
        RETURNING attempts
      `).bind(now, MAX_CODE_ATTEMPTS).first()
      if (attempt?.attempts >= MAX_CODE_ATTEMPTS) {
        await env.PROJECTS_DB.prepare("DELETE FROM admin_recovery_challenges WHERE id = 'default'").run()
      }
      return json({ error: 'The verification code is incorrect.' }, 400)
    }

    const password = await hashAdminPassword(body.newPassword)
    const consumed = await env.PROJECTS_DB.prepare(`
      DELETE FROM admin_recovery_challenges
      WHERE id = 'default' AND code_hash = ? AND expires_at > ? AND attempts < ?
      RETURNING id
    `).bind(suppliedHash, now, MAX_CODE_ATTEMPTS).first()
    if (!consumed) return json({ error: 'The verification code was already used or has expired. Request a new one.' }, 400)

    await env.PROJECTS_DB.prepare(`
      INSERT INTO admin_passwords (id, password_salt, password_hash, updated_at)
      VALUES ('default', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        password_salt = excluded.password_salt,
        password_hash = excluded.password_hash,
        updated_at = excluded.updated_at
    `).bind(password.salt, password.hash, Date.now()).run()
    return json({ changed: true }, 200, { 'Set-Cookie': clearSession(request) })
  }

  return json({ error: 'Unsupported password recovery action.' }, 400)
}
