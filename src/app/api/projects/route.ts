export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { projectSchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, forbidden, serverError } from '@/lib/response'
import { listAccessibleProjects, createProject } from '@/services/project.service'
import { resolveWorkspaceContext, isWorkspaceContext } from '@/lib/workspaceContext'
import type { Role } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const ctx = await resolveWorkspaceContext(req, session)
    if (!isWorkspaceContext(ctx)) return ctx
    return ok(await listAccessibleProjects({ userId: session.userId, role: session.role as Role }, ctx.workspaceId))
  } catch (err) {
    console.error('[projects:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    if (session.role === 'EMPLOYEE') return forbidden('Employees cannot create shared projects')
    const ctx = await resolveWorkspaceContext(req, session)
    if (!isWorkspaceContext(ctx)) return ctx
    const body = await req.json()
    const result = projectSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    return created(await createProject(session.userId, ctx.workspaceId, result.data))
  } catch (err) {
    console.error('[projects:POST]', err)
    return serverError()
  }
}
