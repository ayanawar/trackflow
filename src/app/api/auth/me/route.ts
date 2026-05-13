export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { updateUserSchema } from '@/lib/schemas'
import { ok, badRequest, unauthorized, serverError } from '@/lib/response'
import { getMe, updateMe } from '@/services/auth.service'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const user = await getMe(session.userId)
    if (!user) return unauthorized()
    return ok(user)
  } catch (err) {
    console.error('[me:GET]', err)
    return serverError()
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json()
    const result = updateUserSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    const user = await updateMe(session.userId, result.data)
    return ok(user)
  } catch (err) {
    console.error('[me:PATCH]', err)
    return serverError()
  }
}
