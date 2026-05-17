export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { signToken, setTokenCookie, setRefreshCookie } from '@/lib/auth'
import { googleCompleteSchema } from '@/lib/schemas'
import { created, badRequest, unauthorized, conflict, serverError } from '@/lib/response'
import { completeGoogleSignup } from '@/services/auth.service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = googleCompleteSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    let signupResult: Awaited<ReturnType<typeof completeGoogleSignup>>
    try {
      signupResult = await completeGoogleSignup(result.data)
    } catch (err) {
      if (err instanceof Error) {
        const code = (err as { code?: string }).code
        if (code === 'CONFLICT') return conflict(err.message)
        if (err.message.startsWith('Setup link')) return unauthorized(err.message)
        return badRequest(err.message)
      }
      return serverError()
    }

    const { user, rawRefreshToken } = signupResult
    const role = user.role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
    const token = await signToken({ userId: user.id, email: user.email, name: user.name, role })
    setTokenCookie(token)
    setRefreshCookie(rawRefreshToken)
    return created({ user, token })
  } catch (err) {
    console.error('[google-complete]', err)
    return serverError()
  }
}
