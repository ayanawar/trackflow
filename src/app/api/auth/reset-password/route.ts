export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { resetPasswordSchema } from '@/lib/schemas'
import { ok, badRequest, serverError } from '@/lib/response'
import { resetPassword } from '@/services/auth.service'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { recordSecurityEvent, requestSecurityContext } from '@/services/securityEvent.service'

export async function POST(req: NextRequest) {
  try {
    const securityContext = requestSecurityContext(req)
    if (!checkRateLimit(rateLimitKey(req, 'reset-password'), 10, 60 * 60 * 1000).allowed) {
      await recordSecurityEvent({ type: 'RATE_LIMITED', ...securityContext, metadata: { scope: 'reset-password' } })
      return Response.json({ error: 'Too many requests' }, { status: 429 })
    }
    const body = await req.json()
    const result = resetPasswordSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    try {
      await resetPassword(result.data.token, result.data.password)
    } catch {
      await recordSecurityEvent({ type: 'PASSWORD_RESET_FAILED', ...securityContext })
      return badRequest('Invalid or expired reset token')
    }

    await recordSecurityEvent({ type: 'PASSWORD_RESET_SUCCEEDED', ...securityContext })
    return ok({ message: 'Password updated successfully' })
  } catch (err) {
    console.error('[reset-password]', err)
    return serverError()
  }
}
