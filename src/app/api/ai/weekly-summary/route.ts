export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { unauthorized } from '@/lib/response'
import { generateWeeklySummary, getTimeSuggestions, RateLimitError, ServiceUnavailableError } from '@/services/insights.service'
import { timeEntryAccessWhere } from '@/services/authorization.service'
import prisma from '@/lib/prisma'
import type { Role } from '@/types'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return unauthorized()

  const user = { userId: session.userId, role: session.role as Role }
  const entryWhere = await timeEntryAccessWhere(user)

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  const entries = await prisma.timeEntry.findMany({
    where: {
      AND: [entryWhere, {
        startTime: { gte: weekStart },
        duration: { not: null },
        isRunning: false,
      }],
    },
    select: {
      duration: true,
      billable: true,
      startTime: true,
      projectId: true,
      description: true,
      project: { select: { id: true, name: true } },
      tag: { select: { name: true } },
    },
  })

  const weekSeconds = entries.reduce((s, e) => s + (e.duration ?? 0), 0)
  const billableSeconds = entries.filter(e => e.billable).reduce((s, e) => s + (e.duration ?? 0), 0)

  const projectMap: Record<string, { name: string; totalSeconds: number }> = {}
  entries.forEach(e => {
    const key = e.projectId ?? '__none__'
    if (!projectMap[key]) projectMap[key] = { name: e.project?.name ?? 'No project', totalSeconds: 0 }
    projectMap[key].totalSeconds += e.duration ?? 0
  })
  const projects = Object.values(projectMap).sort((a, b) => b.totalSeconds - a.totalSeconds)

  const dailyMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    dailyMap[d.toISOString().slice(0, 10)] = 0
  }
  entries.forEach(e => {
    const key = new Date(e.startTime).toISOString().slice(0, 10)
    if (dailyMap[key] !== undefined) dailyMap[key] += e.duration ?? 0
  })
  const dailyTotals = Object.entries(dailyMap).map(([date, seconds]) => ({ date, seconds }))

  const tagMap: Record<string, number> = {}
  entries.forEach(e => { if (e.tag) tagMap[e.tag.name] = (tagMap[e.tag.name] ?? 0) + (e.duration ?? 0) })
  const topTags = Object.entries(tagMap).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, seconds]) => ({ name, seconds }))

  const recentDescriptions = entries
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 10)
    .map(e => e.description ?? '')
    .filter(Boolean)

  try {
    const [summaryResult, suggestionsResult] = await Promise.all([
      generateWeeklySummary(session.userId, { weekSeconds, billableSeconds, entryCount: entries.length, projects, dailyTotals, topTags }),
      getTimeSuggestions(session.userId, { weekSeconds, projects, recentDescriptions }),
    ])
    return NextResponse.json({ summary: summaryResult.summary, suggestions: suggestionsResult.suggestions })
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
    }
    if (err instanceof ServiceUnavailableError) {
      return NextResponse.json({ error: 'AI unavailable.' }, { status: 503 })
    }
    console.error('[ai/weekly-summary:GET]', err)
    return NextResponse.json({ error: 'AI unavailable.' }, { status: 503 })
  }
}
