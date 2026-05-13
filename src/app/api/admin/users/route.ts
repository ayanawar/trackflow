export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSessionFromRequest, requireRole } from '@/lib/auth'
import { adminCreateUserSchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/response'
import { createAdminUser, findAllByWorkspace, findById } from '@/repositories/user.repository'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard

    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const admin = await findById(session.userId)
    if (!admin) return unauthorized()

    const users = await findAllByWorkspace(admin.workspace)
    return ok(users)
  } catch (err) {
    console.error('[admin/users:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const admin = await findById(session.userId)
    if (!admin) return unauthorized()

    const body = await req.json()
    const result = adminCreateUserSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    const password = result.data.password
      ? await bcrypt.hash(result.data.password, 12)
      : undefined
    const user = await createAdminUser({ ...result.data, workspace: admin.workspace, password })
    return created(user)
  } catch (err) {
    console.error('[admin/users:POST]', err)
    return serverError()
  }
}
