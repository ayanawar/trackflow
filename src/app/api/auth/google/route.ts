export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { signToken, setTokenCookie, setRefreshCookie } from '@/lib/auth'
import { googleAuthSchema } from '@/lib/schemas'
import { ok, badRequest, unauthorized, serverError } from '@/lib/response'
import { googleAuth } from '@/services/auth.service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = googleAuthSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    let authResult: Awaited<ReturnType<typeof googleAuth>>
    try {
      authResult = await googleAuth(result.data.idToken)
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'Invalid Google token') return unauthorized(err.message)
        return badRequest(err.message)
      }
      return serverError()
    }

    // New users land on the completion screen — no cookies, no DB row.
    if (authResult.status === 'NEEDS_SETUP') {
      return NextResponse.json(authResult, { status: 202 })
    }

    const { user, rawRefreshToken } = authResult
    if (!user) return serverError()
    const role = ('role' in user ? user.role : 'EMPLOYEE') as 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
    const token = await signToken({ userId: user.id, email: user.email, name: user.name, role })
    setTokenCookie(token)
    setRefreshCookie(rawRefreshToken)
    return ok({ status: 'AUTHENTICATED', user, token })
  } catch (err) {
    console.error('[google-auth]', err)
    return serverError()
  }
}
