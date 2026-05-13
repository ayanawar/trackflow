export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { signToken, setTokenCookie } from '@/lib/auth'
import { googleAuthSchema } from '@/lib/schemas'
import { ok, badRequest, unauthorized, serverError } from '@/lib/response'
import { googleAuth } from '@/services/auth.service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = googleAuthSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    let user: Awaited<ReturnType<typeof googleAuth>>
    try {
      user = await googleAuth(result.data.idToken)
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'Invalid Google token') return unauthorized(err.message)
        return badRequest(err.message)
      }
      return serverError()
    }

    const token = await signToken({ userId: user.id, email: user.email, name: user.name })
    setTokenCookie(token)
    return ok({ user, token })
  } catch (err) {
    console.error('[google-auth]', err)
    return serverError()
  }
}
