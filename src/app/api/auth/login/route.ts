export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { signToken, setTokenCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/schemas'
import { ok, badRequest, unauthorized, serverError } from '@/lib/response'
import { login } from '@/services/auth.service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = loginSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    let user: { id: string; name: string; email: string; workspace: string }
    try {
      user = await login(result.data.email, result.data.password)
    } catch {
      return unauthorized('Invalid credentials')
    }

    const token = await signToken({ userId: user.id, email: user.email, name: user.name })
    setTokenCookie(token)
    return ok({ user, token })
  } catch (err) {
    console.error('[login]', err)
    return serverError()
  }
}
