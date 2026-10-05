const SESSION_COOKIE = 'ma_admin_session'
const SESSION_SECONDS = 8 * 60 * 60
const encoder = new TextEncoder()

function base64Url(bytes) {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))))
}

export async function createSession(secret, request) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const payload = base64Url(encoder.encode(JSON.stringify({ exp: now + SESSION_SECONDS, iat: now })))
  const unsigned = `${header}.${payload}`
  const token = `${unsigned}.${await sign(unsigned, secret)}`
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${SESSION_COOKIE}=${token}; HttpOnly${secure}; SameSite=Strict; Path=/api; Max-Age=${SESSION_SECONDS}`
}

export function clearSession(request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${SESSION_COOKIE}=; HttpOnly${secure}; SameSite=Strict; Path=/api; Max-Age=0`
}

export async function isAuthorized(request, secret) {
  const token = request.headers.get('Cookie')?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1)
  if (!token) return false

  const [header, payload, signature, ...extra] = token.split('.')
  if (!header || !payload || !signature || extra.length) return false

  try {
    const unsigned = `${header}.${payload}`
    const expected = decodeBase64Url(await sign(unsigned, secret))
    const actual = decodeBase64Url(signature)
    if (expected.length !== actual.length) return false
    let difference = 0
    for (let index = 0; index < expected.length; index += 1) difference |= expected[index] ^ actual[index]
    if (difference !== 0) return false
    const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)))
    return Number.isInteger(claims.exp) && claims.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  })
}

export function isSameOrigin(request) {
  const origin = request.headers.get('Origin')
  return !origin || origin === new URL(request.url).origin
}

export async function matchesPassword(input, expected) {
  const [actual, correct] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(input)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ])
  const actualBytes = new Uint8Array(actual)
  const correctBytes = new Uint8Array(correct)
  let difference = 0
  for (let index = 0; index < actualBytes.length; index += 1) difference |= actualBytes[index] ^ correctBytes[index]
  return difference === 0
}

export async function hashClientIp(ip, secret) {
  return sign(ip, secret)
}
