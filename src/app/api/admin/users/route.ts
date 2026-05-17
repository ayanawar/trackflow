export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSessionFromRequest, requireRole } from '@/lib/auth'
import { adminCreateUserSchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/response'
import { createAdminUser, findAllByWorkspaceId } from '@/repositories/user.repository'
import { resolveWorkspaceContext, isWorkspaceContext } from '@/lib/workspaceContext'
import * as workspaceMembershipRepo from '@/repositories/workspaceMembership.repository'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard

    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const ctx = await resolveWorkspaceContext(req, session)
    if (!isWorkspaceContext(ctx)) return ctx

    const users = await findAllByWorkspaceId(ctx.workspaceId)
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
    const ctx = await resolveWorkspaceContext(req, session)
    if (!isWorkspaceContext(ctx)) return ctx

    const body = await req.json()
    const result = adminCreateUserSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    const password = result.data.password
      ? await bcrypt.hash(result.data.password, 12)
      : undefined
    const user = await createAdminUser({ ...result.data, password })
    await workspaceMembershipRepo.create({
      workspaceId: ctx.workspaceId,
      userId: user.id,
      role: result.data.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    })
    return created(user)
  } catch (err) {
    console.error('[admin/users:POST]', err)
    return serverError()
  }
}
