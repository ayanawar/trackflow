export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest, requireRole } from '@/lib/auth'
import { clientSchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/response'
import { createClient, listClients } from '@/services/client.service'
import { resolveWorkspaceContext, isWorkspaceContext } from '@/lib/workspaceContext'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const ctx = await resolveWorkspaceContext(req, session)
    if (!isWorkspaceContext(ctx)) return ctx
    return ok(await listClients(ctx.workspaceId))
  } catch (err) {
    console.error('[admin/clients:GET]', err)
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
    const result = clientSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    return created(await createClient(session.userId, ctx.workspaceId, result.data))
  } catch (err) {
    console.error('[admin/clients:POST]', err)
    return serverError()
  }
}
