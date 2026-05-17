export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { workspaceDeleteSchema } from '@/lib/schemas'
import {
  badRequest,
  noContent,
  notFound,
  ok,
  serverError,
  unauthorized,
} from '@/lib/response'
import * as workspaceRepo from '@/repositories/workspace.repository'
import * as workspaceService from '@/services/workspace.service'
import { canAccessWorkspace } from '@/services/authorization.service'
import { WorkspaceServiceError } from '@/services/workspace.service'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const can = await canAccessWorkspace(session.userId, params.id)
    if (!can) return notFound()
    const ws = await workspaceRepo.findById(params.id)
    if (!ws) return notFound()
    return ok(ws)
  } catch (err) {
    console.error('[workspaces/[id]:GET]', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json().catch(() => ({}))
    const parsed = workspaceDeleteSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    try {
      await workspaceService.deleteWorkspace({
        actorUserId: session.userId,
        workspaceId: params.id,
        confirmName: parsed.data.confirmName,
      })
      return noContent()
    } catch (err) {
      if (err instanceof WorkspaceServiceError) {
        if (err.code === 'NOT_FOUND') return notFound()
        if (err.code === 'BAD_REQUEST') return badRequest(err.message)
        if (err.code === 'WOULD_ORPHAN') {
          return NextResponse.json(
            { error: err.message, blockedUsers: err.meta?.blockedUsers ?? [] },
            { status: 409 },
          )
        }
      }
      throw err
    }
  } catch (err) {
    console.error('[workspaces/[id]:DELETE]', err)
    return serverError()
  }
}
