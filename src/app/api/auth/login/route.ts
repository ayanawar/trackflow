export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { signToken, setTokenCookie, setRefreshCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/schemas'
import { ok, badRequest, unauthorized, serverError } from '@/lib/response'
import { login } from '@/services/auth.service'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { recordSecurityEvent, requestSecurityContext } from '@/services/securityEvent.service'

export async function POST(req: NextRequest) {
  const securityContext = requestSecurityContext(req)
  if (!checkRateLimit(rateLimitKey(req, 'login'), 10, 15 * 60 * 1000).allowed) {
    await recordSecurityEvent({ type: 'RATE_LIMITED', ...securityContext, metadata: { scope: 'login' } })
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const result = loginSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    let loginResult: Awaited<ReturnType<typeof login>>
    try {
      loginResult = await login(result.data.email, result.data.password)
    } catch {
      await recordSecurityEvent({ type: 'LOGIN_FAILED', email: result.data.email, ...securityContext })
      return unauthorized('Invalid credentials')
    }

    const { user, rawRefreshToken } = loginResult
    const token = await signToken({ userId: user.id, email: user.email, name: user.name, role: user.role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE' })
    setTokenCookie(token)
    setRefreshCookie(rawRefreshToken)
    await recordSecurityEvent({ type: 'LOGIN_SUCCEEDED', userId: user.id, email: user.email, ...securityContext })
    return ok({ user, token })
  } catch (err) {
    console.error('[login]', err)
    return serverError()
  }
}
