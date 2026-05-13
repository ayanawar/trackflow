export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { signToken, setTokenCookie, setRefreshCookie } from '@/lib/auth'
import { registerSchema } from '@/lib/schemas'
import { created, badRequest, serverError } from '@/lib/response'
import { register } from '@/services/auth.service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = registerSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    let registerResult: Awaited<ReturnType<typeof register>>
    try {
      registerResult = await register(result.data)
    } catch (err) {
      return badRequest(err instanceof Error ? err.message : 'Registration failed')
    }

    const { user, rawRefreshToken } = registerResult
    const token = await signToken({ userId: user.id, email: user.email, name: user.name, role: user.role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE' })
    setTokenCookie(token)
    setRefreshCookie(rawRefreshToken)
    return created({ user, token })
  } catch (err) {
    console.error('[register]', err)
    return serverError()
  }
}
