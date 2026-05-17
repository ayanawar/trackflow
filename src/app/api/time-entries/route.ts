export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { timeEntrySchema, calendarQuerySchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, forbidden, serverError } from '@/lib/response'
import { listAccessibleEntries, createEntry } from '@/services/timeEntry.service'
import { findAllInDateRange } from '@/repositories/timeEntry.repository'
import { resolveWorkspaceContext, isWorkspaceContext } from '@/lib/workspaceContext'
import type { Role } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const ctx = await resolveWorkspaceContext(req, session)
    if (!isWorkspaceContext(ctx)) return ctx
    const { searchParams } = new URL(req.url)

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (startDate !== null || endDate !== null) {
      if (!startDate || !endDate) {
        return badRequest('startDate and endDate must both be provided')
      }

      const parsed = calendarQuerySchema.safeParse({
        startDate,
        endDate,
        userId: searchParams.get('userId') ?? undefined,
        tagId: searchParams.get('tagId') ?? undefined,
        projectId: searchParams.get('projectId') ?? undefined,
        limit: searchParams.get('limit') ?? undefined,
      })
      if (!parsed.success) return badRequest(parsed.error.issues[0].message)

      const start = new Date(`${parsed.data.startDate}T00:00:00.000Z`)
      const end = new Date(`${parsed.data.endDate}T23:59:59.999Z`)

      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays > 31) return badRequest('Date range must not exceed 31 days')

      if (parsed.data.userId && session.role === 'EMPLOYEE' && parsed.data.userId !== session.userId) {
        return forbidden()
      }

      const entries = await findAllInDateRange(
        { userId: session.userId, role: session.role as Role },
        ctx.workspaceId,
        start,
        end,
        {
          userId: parsed.data.userId,
          tagId: parsed.data.tagId,
          projectId: parsed.data.projectId,
        },
      )
      return ok(entries)
    }

    const limit = parseInt(searchParams.get('limit') ?? '100')
    const tagId = searchParams.get('tagId')
    return ok(await listAccessibleEntries(
      { userId: session.userId, role: session.role as Role },
      ctx.workspaceId,
      limit,
      { tagId },
    ))
  } catch (err) {
    console.error('[time-entries:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const ctx = await resolveWorkspaceContext(req, session)
    if (!isWorkspaceContext(ctx)) return ctx
    const body = await req.json()
    const result = timeEntrySchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    try {
      return created(await createEntry(session.userId, ctx.workspaceId, result.data, session.role as Role))
    } catch (err) {
      if (err instanceof Error && err.message === 'Forbidden') return forbidden()
      throw err
    }
  } catch (err) {
    console.error('[time-entries:POST]', err)
    return serverError()
  }
}
