import prisma from '@/lib/prisma'
import { projectAccessWhere, timeEntryAccessWhere } from '@/services/authorization.service'
import type { Role, Stats } from '@/types'

interface CacheEntry { data: Stats; expiresAt: number }
const statsCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 30_000

export function invalidateStatsCache(userId: string) {
  statsCache.delete(userId)
}

export async function getStats(userId: string): Promise<Stats> {
  const cached = statsCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.data

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(todayStart.getDate() - todayStart.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const sevenDaysAgo = new Date(todayStart)
  sevenDaysAgo.setDate(todayStart.getDate() - 6)

  const windowStart = monthStart < sevenDaysAgo ? monthStart : sevenDaysAgo

  const [periodEntries, totalEntries, projects] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { userId, startTime: { gte: windowStart }, duration: { not: null } },
      select: { duration: true, startTime: true },
    }),
    prisma.timeEntry.count({ where: { userId } }),
    prisma.project.findMany({
      where: { userId },
      include: { timeEntries: { select: { duration: true }, where: { duration: { not: null } } } },
    }),
  ])

  const sum = (items: { duration: number | null }[]) =>
    items.reduce((s, e) => s + (e.duration ?? 0), 0)

  const todayEntries = periodEntries.filter(e => new Date(e.startTime) >= todayStart)
  const weekEntries = periodEntries.filter(e => new Date(e.startTime) >= weekStart)
  const monthEntries = periodEntries.filter(e => new Date(e.startTime) >= monthStart)

  const dailyTotals: { date: string; seconds: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const day = new Date(todayStart)
    day.setDate(day.getDate() - i)
    const nextDay = new Date(day)
    nextDay.setDate(day.getDate() + 1)
    const dayEntries = periodEntries.filter(e => {
      const t = new Date(e.startTime)
      return t >= day && t < nextDay
    })
    dailyTotals.push({ date: day.toISOString().slice(0, 10), seconds: sum(dayEntries) })
  }

  const projectsWithTotals = projects
    .map(p => ({ ...p, totalSeconds: sum(p.timeEntries) }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds)

  const topProject = projectsWithTotals[0] ?? null

  const data: Stats = {
    todaySeconds: sum(todayEntries),
    weekSeconds: sum(weekEntries),
    monthSeconds: sum(monthEntries),
    totalEntries,
    topProject: topProject
      ? { id: topProject.id, name: topProject.name, color: topProject.color, userId: topProject.userId, totalSeconds: topProject.totalSeconds, createdAt: topProject.createdAt.toISOString() }
      : null,
    dailyTotals,
  }

  statsCache.set(userId, { data, expiresAt: Date.now() + CACHE_TTL_MS })
  return data
}

export async function getScopedStats(user: { userId: string; role: Role }): Promise<Stats> {
  if (user.role === 'EMPLOYEE') return getStats(user.userId)

  const cacheKey = `${user.role}:${user.userId}:scoped`
  const cached = statsCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.data

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(todayStart.getDate() - todayStart.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const sevenDaysAgo = new Date(todayStart)
  sevenDaysAgo.setDate(todayStart.getDate() - 6)
  const windowStart = monthStart < sevenDaysAgo ? monthStart : sevenDaysAgo
  const entryWhere = await timeEntryAccessWhere(user)
  const projectWhere = await projectAccessWhere(user)

  const [periodEntries, totalEntries, projects] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { AND: [entryWhere, { startTime: { gte: windowStart }, duration: { not: null } }] },
      select: { duration: true, startTime: true },
    }),
    prisma.timeEntry.count({ where: entryWhere }),
    prisma.project.findMany({
      where: projectWhere,
      include: { timeEntries: { select: { duration: true }, where: { duration: { not: null } } } },
    }),
  ])

  const sum = (items: { duration: number | null }[]) =>
    items.reduce((s, e) => s + (e.duration ?? 0), 0)
  const todayEntries = periodEntries.filter(e => new Date(e.startTime) >= todayStart)
  const weekEntries = periodEntries.filter(e => new Date(e.startTime) >= weekStart)
  const monthEntries = periodEntries.filter(e => new Date(e.startTime) >= monthStart)
  const dailyTotals: { date: string; seconds: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const day = new Date(todayStart)
    day.setDate(day.getDate() - i)
    const nextDay = new Date(day)
    nextDay.setDate(day.getDate() + 1)
    dailyTotals.push({
      date: day.toISOString().slice(0, 10),
      seconds: sum(periodEntries.filter(e => {
        const t = new Date(e.startTime)
        return t >= day && t < nextDay
      })),
    })
  }
  const topProject = projects
    .map(p => ({ ...p, totalSeconds: sum(p.timeEntries) }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds)[0] ?? null

  const data: Stats = {
    todaySeconds: sum(todayEntries),
    weekSeconds: sum(weekEntries),
    monthSeconds: sum(monthEntries),
    totalEntries,
    topProject: topProject
      ? { id: topProject.id, name: topProject.name, color: topProject.color, userId: topProject.userId, totalSeconds: topProject.totalSeconds, createdAt: topProject.createdAt.toISOString() }
      : null,
    dailyTotals,
  }

  statsCache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS })
  return data
}
