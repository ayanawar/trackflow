import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'
import { timeEntryAccessWhere } from '@/services/authorization.service'
import prisma from '@/lib/prisma'
import type { Role } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const { searchParams } = new URL(req.url)
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('range') ?? '30')))

    const now = new Date()
    const rangeStart = new Date(now)
    rangeStart.setDate(now.getDate() - days)
    rangeStart.setHours(0, 0, 0, 0)

    const user = { userId: session.userId, role: session.role as Role }
    const entryWhere = await timeEntryAccessWhere(user)

    const entries = await prisma.timeEntry.findMany({
      where: {
        AND: [entryWhere, {
          startTime: { gte: rangeStart },
          duration: { not: null },
          isRunning: false,
        }],
      },
      select: {
        duration: true,
        billable: true,
        startTime: true,
        projectId: true,
        tagId: true,
        userId: true,
        project: { select: { id: true, name: true, color: true } },
        tag: { select: { id: true, name: true, color: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    })

    const totalSeconds = entries.reduce((s, e) => s + (e.duration ?? 0), 0)
    const billableSeconds = entries.filter(e => e.billable).reduce((s, e) => s + (e.duration ?? 0), 0)

    // Build daily totals for the full range
    const dailyMap: Record<string, { seconds: number; billableSeconds: number }> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      dailyMap[d.toISOString().slice(0, 10)] = { seconds: 0, billableSeconds: 0 }
    }
    entries.forEach(e => {
      const key = new Date(e.startTime).toISOString().slice(0, 10)
      if (dailyMap[key]) {
        dailyMap[key].seconds += e.duration ?? 0
        if (e.billable) dailyMap[key].billableSeconds += e.duration ?? 0
      }
    })
    const dailyTotals = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }))

    // Project breakdown
    const projectMap: Record<string, { id: string; name: string; color: string; seconds: number; billableSeconds: number }> = {}
    entries.forEach(e => {
      const key = e.projectId ?? '__none__'
      if (!projectMap[key]) projectMap[key] = {
        id: key,
        name: e.project?.name ?? 'No project',
        color: e.project?.color ?? '#6b7280',
        seconds: 0,
        billableSeconds: 0,
      }
      projectMap[key].seconds += e.duration ?? 0
      if (e.billable) projectMap[key].billableSeconds += e.duration ?? 0
    })
    const projectBreakdown = Object.values(projectMap)
      .sort((a, b) => b.seconds - a.seconds)
      .map(p => ({ ...p, percentage: totalSeconds > 0 ? Math.round((p.seconds / totalSeconds) * 100) : 0 }))

    // Tag breakdown
    const tagMap: Record<string, { id: string; name: string; color: string; seconds: number }> = {}
    entries.forEach(e => {
      if (!e.tagId || !e.tag) return
      if (!tagMap[e.tagId]) tagMap[e.tagId] = { id: e.tagId, name: e.tag.name, color: e.tag.color, seconds: 0 }
      tagMap[e.tagId].seconds += e.duration ?? 0
    })
    const tagBreakdown = Object.values(tagMap).sort((a, b) => b.seconds - a.seconds)

    // Team breakdown (admin/manager only)
    let teamBreakdown: { userId: string; name: string; seconds: number; billableSeconds: number }[] = []
    if (session.role === 'ADMIN' || session.role === 'MANAGER') {
      const userMap: Record<string, { userId: string; name: string; seconds: number; billableSeconds: number }> = {}
      entries.forEach(e => {
        if (!userMap[e.userId]) userMap[e.userId] = { userId: e.userId, name: e.user?.name ?? e.userId, seconds: 0, billableSeconds: 0 }
        userMap[e.userId].seconds += e.duration ?? 0
        if (e.billable) userMap[e.userId].billableSeconds += e.duration ?? 0
      })
      teamBreakdown = Object.values(userMap).sort((a, b) => b.seconds - a.seconds)
    }

    const activeDays = dailyTotals.filter(d => d.seconds > 0)
    const mostActiveDay = activeDays.length > 0
      ? activeDays.reduce((best, d) => d.seconds > best.seconds ? d : best).date
      : null

    return ok({
      range: days,
      totalSeconds,
      billableSeconds,
      nonBillableSeconds: totalSeconds - billableSeconds,
      entryCount: entries.length,
      avgDailySeconds: activeDays.length > 0 ? Math.round(totalSeconds / activeDays.length) : 0,
      mostActiveDay,
      dailyTotals,
      projectBreakdown,
      tagBreakdown,
      teamBreakdown,
    })
  } catch (err) {
    console.error('[analytics:GET]', err)
    return serverError()
  }
}
