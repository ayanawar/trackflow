export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'
import prisma from '@/lib/prisma'

/**
 * GET /api/time-entries/today
 * Returns today's time entries for the current user.
 * Used by the Chrome extension background service worker to check
 * whether a 5:30 PM reminder notification should be sent.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return unauthorized()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  try {
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: session.userId,
        startTime: { gte: todayStart },
      },
      select: {
        id: true,
        duration: true,
        isRunning: true,
        startTime: true,
        project: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'desc' },
    })

    const totalSeconds = entries
      .filter(e => !e.isRunning && e.duration)
      .reduce((s, e) => s + (e.duration ?? 0), 0)

    return ok({
      entries,
      totalSeconds,
      hasLogged: entries.some(e => !e.isRunning),
    })
  } catch (err) {
    console.error('[time-entries/today:GET]', err)
    return serverError()
  }
}
