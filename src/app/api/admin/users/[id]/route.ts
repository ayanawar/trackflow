export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest, requireRole } from '@/lib/auth'
import { adminUpdateUserSchema } from '@/lib/schemas'
import { ok, badRequest, unauthorized, notFound, serverError } from '@/lib/response'
import { findById, findByIdInWorkspace, updateUser } from '@/repositories/user.repository'
import { resolveWorkspaceContext, isWorkspaceContext } from '@/lib/workspaceContext'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const admin = await findById(session.userId)
    if (!admin) return unauthorized()
    const ctx = await resolveWorkspaceContext(req, session)
    if (!isWorkspaceContext(ctx)) return ctx

    const body = await req.json()
    const result = adminUpdateUserSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    const existing = await findByIdInWorkspace(params.id, ctx.workspaceId)
    if (!existing) return notFound('User not found')

    const user = await updateUser(params.id, result.data)
    return ok(user)
  } catch (err) {
    console.error('[admin/users:PATCH]', err)
    return serverError()
  }
}
