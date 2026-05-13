export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { signToken, setTokenCookie, setRefreshCookie, getRefreshFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'
import { refresh } from '@/services/auth.service'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { recordSecurityEvent, requestSecurityContext } from '@/services/securityEvent.service'

export async function POST(req: NextRequest) {
  try {
    const securityContext = requestSecurityContext(req)
    if (!checkRateLimit(rateLimitKey(req, 'refresh'), 30, 15 * 60 * 1000).allowed) {
      await recordSecurityEvent({ type: 'RATE_LIMITED', ...securityContext, metadata: { scope: 'refresh' } })
      return Response.json({ error: 'Too many requests' }, { status: 429 })
    }
    const rawRefreshToken = getRefreshFromRequest(req)
    if (!rawRefreshToken) return unauthorized('Invalid or expired refresh token')

    let result: Awaited<ReturnType<typeof refresh>>
    try {
      result = await refresh(rawRefreshToken)
    } catch (err) {
      await recordSecurityEvent({ type: 'REFRESH_FAILED', ...securityContext })
      return unauthorized(err instanceof Error ? err.message : 'Invalid or expired refresh token')
    }

    const { user, rawRefreshToken: newRawToken } = result
    const role = user.role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
    const token = await signToken({ userId: user.id, email: user.email, name: user.name, role })
    setTokenCookie(token)
    setRefreshCookie(newRawToken)
    return ok({ message: 'Session refreshed', token })
  } catch (err) {
    console.error('[refresh]', err)
    return serverError()
  }
}
