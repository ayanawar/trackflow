export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(todayStart.getDate() - todayStart.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [todayEntries, weekEntries, monthEntries, totalEntries, projects] = await Promise.all([
      prisma.timeEntry.findMany({
        where: { userId: session.userId, startTime: { gte: todayStart }, duration: { not: null } },
        select: { duration: true },
      }),
      prisma.timeEntry.findMany({
        where: { userId: session.userId, startTime: { gte: weekStart }, duration: { not: null } },
        select: { duration: true },
      }),
      prisma.timeEntry.findMany({
        where: { userId: session.userId, startTime: { gte: monthStart }, duration: { not: null } },
        select: { duration: true },
      }),
      prisma.timeEntry.count({ where: { userId: session.userId } }),
      prisma.project.findMany({
        where: { userId: session.userId },
        include: {
          timeEntries: { select: { duration: true }, where: { duration: { not: null } } },
        },
      }),
    ])

    const sum = (arr: { duration: number | null }[]) =>
      arr.reduce((s, e) => s + (e.duration ?? 0), 0)

    // Daily totals for last 7 days
    const dailyTotals = await Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date(todayStart)
        date.setDate(date.getDate() - (6 - i))
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)
        return prisma.timeEntry
          .findMany({
            where: { userId: session.userId, startTime: { gte: date, lt: nextDate }, duration: { not: null } },
            select: { duration: true },
          })
          .then((entries) => ({
            date: date.toISOString().slice(0, 10),
            seconds: sum(entries),
          }))
      })
    )

    // Top project
    const projectsWithTotals = projects
      .map((p) => ({ ...p, totalSeconds: sum(p.timeEntries) }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds)

    const topProject = projectsWithTotals[0] ?? null

    return ok({
      todaySeconds: sum(todayEntries),
      weekSeconds: sum(weekEntries),
      monthSeconds: sum(monthEntries),
      totalEntries,
      topProject: topProject
        ? { id: topProject.id, name: topProject.name, color: topProject.color, totalSeconds: topProject.totalSeconds }
        : null,
      dailyTotals,
    })
  } catch (err) {
    console.error('[stats:GET]', err)
    return serverError()
  }
}
