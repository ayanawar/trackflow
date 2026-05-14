export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { signToken, setTokenCookie, setRefreshCookie } from '@/lib/auth'
import { ok, badRequest, serverError } from '@/lib/response'
import { acceptInviteSchema } from '@/lib/schemas'
import { getInvite, acceptInvite } from '@/services/auth.service'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return badRequest('Missing invite token')

    let invite: Awaited<ReturnType<typeof getInvite>>
    try {
      invite = await getInvite(token)
    } catch (err) {
      return badRequest(err instanceof Error ? err.message : 'Invalid or expired invite')
    }

    return ok(invite)
  } catch (err) {
    console.error('[auth/invite:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = acceptInviteSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    let acceptResult: Awaited<ReturnType<typeof acceptInvite>>
    try {
      acceptResult = await acceptInvite(result.data.token, {
        name: result.data.name,
        password: result.data.password,
      })
    } catch (err) {
      return badRequest(err instanceof Error ? err.message : 'Could not accept invite')
    }

    const { user, rawRefreshToken } = acceptResult
    const token = await signToken({ userId: user.id, email: user.email, name: user.name, role: user.role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE' })
    setTokenCookie(token)
    setRefreshCookie(rawRefreshToken)
    return ok({ user, token })
  } catch (err) {
    console.error('[auth/invite:POST]', err)
    return serverError()
  }
}
