import prisma from '@/lib/prisma'
import { timeEntryAccessWhere } from '@/services/authorization.service'
import type { Role } from '@/types'

const include = {
  project: true,
  tag: true,
  task: { select: { id: true, title: true } },
  user: { select: { id: true, name: true, avatarUrl: true } },
} as const

export async function findAllByUser(userId: string, workspaceId: string, limit = 100, filters: { tagId?: string | null } = {}) {
  return prisma.timeEntry.findMany({
    where: { userId, workspaceId, ...(filters.tagId ? { tagId: filters.tagId } : {}) },
    orderBy: { startTime: 'desc' },
    take: Math.min(limit, 500),
    include,
  })
}

export async function findAllAccessible(user: { userId: string; role: Role }, workspaceId: string, limit = 100, filters: { tagId?: string | null } = {}) {
  const where = await timeEntryAccessWhere(user, workspaceId)
  return prisma.timeEntry.findMany({
    where: { AND: [where, filters.tagId ? { tagId: filters.tagId } : {}] },
    orderBy: { startTime: 'desc' },
    take: Math.min(limit, 500),
    include,
  })
}

export async function findEntryById(id: string, userId: string, workspaceId: string) {
  const e = await prisma.timeEntry.findFirst({ where: { id, workspaceId }, include })
  if (!e || e.userId !== userId) return null
  return e
}

export async function findAccessibleEntryById(id: string, user: { userId: string; role: Role }, workspaceId: string) {
  const where = await timeEntryAccessWhere(user, workspaceId)
  return prisma.timeEntry.findFirst({ where: { AND: [{ id }, where] }, include })
}

export async function findRunning(userId: string, workspaceId: string) {
  return prisma.timeEntry.findFirst({ where: { userId, workspaceId, isRunning: true }, include })
}

export async function createEntry(data: {
  description: string
  projectId: string | null
  tagId: string | null
  taskId: string | null
  userId: string
  workspaceId: string
  startTime: Date
  endTime: Date | null
  duration: number | null
  isRunning: boolean
  billable: boolean
}) {
  return prisma.timeEntry.create({ data, include })
}

export async function updateEntry(
  id: string,
  userId: string,
  workspaceId: string,
  data: {
    description?: string
    projectId?: string | null
    tagId?: string | null
    taskId?: string | null
    startTime?: Date
    endTime?: Date | null
    duration?: number | null
    isRunning?: boolean
    isPaused?: boolean
    pausedDuration?: number
    billable?: boolean
  }
) {
  await prisma.timeEntry.findFirstOrThrow({ where: { id, userId, workspaceId } })
  return prisma.timeEntry.update({ where: { id }, data, include })
}

export async function updateEntryById(
  id: string,
  workspaceId: string,
  data: {
    description?: string
    projectId?: string | null
    tagId?: string | null
    taskId?: string | null
    startTime?: Date
    endTime?: Date | null
    duration?: number | null
    isRunning?: boolean
    isPaused?: boolean
    pausedDuration?: number
    billable?: boolean
  }
) {
  await prisma.timeEntry.findFirstOrThrow({ where: { id, workspaceId } })
  return prisma.timeEntry.update({ where: { id }, data, include })
}

export async function stopRunning(userId: string, workspaceId: string, endTime: Date) {
  // Also handle paused entries — stop them all
  return prisma.timeEntry.updateMany({
    where: { userId, workspaceId, OR: [{ isRunning: true }, { isPaused: true }] },
    data: { endTime, isRunning: false, isPaused: false },
  })
}

export async function stopOne(id: string, userId: string, workspaceId: string, endTime: Date, durationSeconds: number) {
  await prisma.timeEntry.findFirstOrThrow({ where: { id, userId, workspaceId } })
  return prisma.timeEntry.update({
    where: { id },
    data: { endTime, duration: durationSeconds, isRunning: false, isPaused: false },
    include,
  })
}

export async function pauseOne(id: string, userId: string, workspaceId: string, pausedDuration: number) {
  await prisma.timeEntry.findFirstOrThrow({ where: { id, userId, workspaceId } })
  return prisma.timeEntry.update({
    where: { id },
    data: { isRunning: false, isPaused: true, pausedDuration },
    include,
  })
}

export async function resumeOne(id: string, userId: string, workspaceId: string, startTime: Date) {
  await prisma.timeEntry.findFirstOrThrow({ where: { id, userId, workspaceId } })
  return prisma.timeEntry.update({
    where: { id },
    data: { isRunning: true, isPaused: false, startTime },
    include,
  })
}

export async function findActiveByUser(userId: string, workspaceId: string) {
  return prisma.timeEntry.findFirst({
    where: { userId, workspaceId, OR: [{ isRunning: true }, { isPaused: true }] },
    include,
  })
}

export async function deleteEntry(id: string, userId: string, workspaceId: string) {
  await prisma.timeEntry.findFirstOrThrow({ where: { id, userId, workspaceId } })
  return prisma.timeEntry.delete({ where: { id } })
}

export async function deleteEntryById(id: string, workspaceId: string) {
  await prisma.timeEntry.findFirstOrThrow({ where: { id, workspaceId } })
  return prisma.timeEntry.delete({ where: { id } })
}

export async function findAllInDateRange(
  user: { userId: string; role: Role },
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  filters: { userId?: string | null; tagId?: string | null; projectId?: string | null } = {},
) {
  const ownerFilter =
    user.role === 'EMPLOYEE'
      ? { userId: user.userId }
      : filters.userId
        ? { userId: filters.userId }
        : {}

  const where = {
    workspaceId,
    ...ownerFilter,
    startTime: { gte: startDate, lte: endDate },
    ...(filters.tagId ? { tagId: filters.tagId } : {}),
    ...(filters.projectId ? { projectId: filters.projectId } : {}),
  }

  return prisma.timeEntry.findMany({
    where,
    orderBy: { startTime: 'asc' },
    take: 1000,
    include,
  })
}
