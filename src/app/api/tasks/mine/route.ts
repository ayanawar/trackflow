export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'
import { resolveWorkspaceContext, isWorkspaceContext } from '@/lib/workspaceContext'
import prisma from '@/lib/prisma'

/**
 * GET /api/tasks/mine
 * Returns all non-completed tasks assigned to the current user.
 * Used by the TrackFlow Chrome extension.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return unauthorized()
  const ctx = await resolveWorkspaceContext(req, session)
  if (!isWorkspaceContext(ctx)) return ctx

  try {
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: session.userId,
        workspaceId: ctx.workspaceId,
        status: { not: 'DONE' },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    })

    return ok(tasks)
  } catch (err) {
    console.error('[tasks/mine:GET]', err)
    return serverError()
  }
}
