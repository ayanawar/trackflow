export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { workspaceCreateSchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, forbidden, conflict, serverError } from '@/lib/response'
import * as workspaceService from '@/services/workspace.service'
import { WorkspaceServiceError } from '@/services/workspace.service'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const list = await workspaceService.listForUser(session.userId)
    return ok(list)
  } catch (err) {
    console.error('[workspaces:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json()
    const parsed = workspaceCreateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    try {
      const ws = await workspaceService.createWorkspace({
        actorUserId: session.userId,
        orgId: parsed.data.orgId,
        name: parsed.data.name,
      })
      return created(ws)
    } catch (err) {
      if (err instanceof WorkspaceServiceError) {
        if (err.code === 'FORBIDDEN') return forbidden(err.message)
        if (err.code === 'CONFLICT') return conflict(err.message)
      }
      throw err
    }
  } catch (err) {
    console.error('[workspaces:POST]', err)
    return serverError()
  }
}
