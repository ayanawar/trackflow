export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { forgotPasswordSchema } from '@/lib/schemas'
import { ok, badRequest, serverError } from '@/lib/response'
import { forgotPassword } from '@/services/auth.service'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { recordSecurityEvent, requestSecurityContext } from '@/services/securityEvent.service'

export async function POST(req: NextRequest) {
  const securityContext = requestSecurityContext(req)
  if (!checkRateLimit(rateLimitKey(req, 'forgot-password'), 5, 60 * 60 * 1000).allowed) {
    await recordSecurityEvent({ type: 'RATE_LIMITED', ...securityContext, metadata: { scope: 'forgot-password' } })
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const result = forgotPasswordSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    await forgotPassword(result.data.email)
    await recordSecurityEvent({ type: 'PASSWORD_RESET_REQUESTED', email: result.data.email, ...securityContext })
    return ok({ message: "If that email exists, reset instructions have been sent." })
  } catch (err) {
    console.error('[forgot-password]', err)
    return serverError()
  }
}
