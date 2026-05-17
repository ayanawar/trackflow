export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest, requireRole } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'
import { getScopedStats } from '@/services/stats.service'
import { resolveWorkspaceContext, isWorkspaceContext } from '@/lib/workspaceContext'
import type { Role } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireRole(['MANAGER', 'ADMIN'])(req)
    if (guard) return guard
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const ctx = await resolveWorkspaceContext(req, session)
    if (!isWorkspaceContext(ctx)) return ctx
    return ok(await getScopedStats({ userId: session.userId, role: session.role as Role }, ctx.workspaceId))
  } catch (err) {
    console.error('[stats:GET]', err)
    return serverError()
  }
}
