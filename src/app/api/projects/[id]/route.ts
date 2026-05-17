export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { projectSchema } from '@/lib/schemas'
import { ok, noContent, badRequest, unauthorized, notFound, serverError } from '@/lib/response'
import { getAccessibleProject, updateAccessibleProject, deleteAccessibleProject } from '@/services/project.service'
import { resolveWorkspaceContext, isWorkspaceContext } from '@/lib/workspaceContext'
import type { Role } from '@/types'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const ctx = await resolveWorkspaceContext(req, session)
    if (!isWorkspaceContext(ctx)) return ctx
    const p = await getAccessibleProject(params.id, { userId: session.userId, role: session.role as Role }, ctx.workspaceId)
    if (!p) return notFound()
    return ok(p)
  } catch (err) {
    console.error('[project:GET]', err)
    return serverError()
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const ctx = await resolveWorkspaceContext(req, session)
    if (!isWorkspaceContext(ctx)) return ctx
    const body = await req.json()
    const result = projectSchema.partial().safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    const updated = await updateAccessibleProject(params.id, { userId: session.userId, role: session.role as Role }, ctx.workspaceId, result.data)
    if (!updated) return notFound()
    return ok(updated)
  } catch (err) {
    console.error('[project:PUT]', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const ctx = await resolveWorkspaceContext(req, session)
    if (!isWorkspaceContext(ctx)) return ctx
    const result = await deleteAccessibleProject(params.id, { userId: session.userId, role: session.role as Role }, ctx.workspaceId)
    if (!result) return notFound()
    return noContent()
  } catch (err) {
    console.error('[project:DELETE]', err)
    return serverError()
  }
}
