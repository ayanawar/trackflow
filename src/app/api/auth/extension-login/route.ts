export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { loginSchema } from '@/lib/schemas'
import { ok, badRequest, unauthorized, serverError } from '@/lib/response'
import { login } from '@/services/auth.service'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'

const rawSecret = process.env.JWT_SECRET ?? 'trackflow-secret-key-change-in-production'
const JWT_SECRET = new TextEncoder().encode(rawSecret)

/**
 * POST /api/auth/extension-login
 *
 * Identical to /api/auth/login but issues a 7-day JWT intended for
 * the Chrome extension (which cannot use httpOnly refresh-token cookies).
 * The token is returned in the response body only — no cookies are set.
 *
 * Rate-limited to the same bucket as regular login.
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(rateLimitKey(req, 'login'), 10, 15 * 60 * 1000).allowed) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    let body: unknown
    try { body = await req.json() } catch { return badRequest('Invalid JSON') }

    const result = loginSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    let loginResult: Awaited<ReturnType<typeof login>>
    try {
      loginResult = await login(result.data.email, result.data.password)
    } catch {
      return unauthorized('Invalid credentials')
    }

    const { user } = loginResult

    // 7-day token — suitable for storage in chrome.storage.local
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    console.log('[extension-login] issued 7d token for', user.email)

    return ok({ user, token })
  } catch (err) {
    console.error('[extension-login]', err)
    return serverError()
  }
}
