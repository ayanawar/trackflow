import * as entryRepo from '@/repositories/timeEntry.repository'
import { invalidateStatsCache } from '@/services/stats.service'
import { canAccessProject } from '@/services/authorization.service'
import { resolveActiveTagForUser } from '@/services/tag.service'
import type { Role } from '@/types'

export async function listEntries(userId: string, workspaceId: string, limit = 100, filters: { tagId?: string | null } = {}) {
  return entryRepo.findAllByUser(userId, workspaceId, limit, filters)
}

export async function listAccessibleEntries(user: { userId: string; role: Role }, workspaceId: string, limit = 100, filters: { tagId?: string | null } = {}) {
  return entryRepo.findAllAccessible(user, workspaceId, limit, filters)
}

export async function getEntry(id: string, userId: string, workspaceId: string) {
  return entryRepo.findEntryById(id, userId, workspaceId)
}

export async function getAccessibleEntry(id: string, user: { userId: string; role: Role }, workspaceId: string) {
  return entryRepo.findAccessibleEntryById(id, user, workspaceId)
}

export async function createEntry(userId: string, workspaceId: string, data: {
  description?: string
  projectId?: string | null
  taskId?: string | null
  tagId?: string | null
  tag?: string | null
  billable?: boolean
  startTime: string
  endTime?: string | null
}, role: Role = 'EMPLOYEE') {
  if (data.projectId) {
    const allowed = await canAccessProject({ userId, role }, data.projectId, ['TRACK', 'MANAGE', 'APPROVE'], workspaceId)
    if (!allowed) throw new Error('Forbidden')
  }
  await entryRepo.stopRunning(userId, workspaceId, new Date())

  let tagId: string | null = null
  if (data.tagId || data.tag) {
    const t = await resolveActiveTagForUser(userId, { tagId: data.tagId, tag: data.tag })
    tagId = t?.id ?? null
  }

  const isRunning = !data.endTime
  const start = new Date(data.startTime)
  const end = data.endTime ? new Date(data.endTime) : null
  const duration = end ? Math.floor((end.getTime() - start.getTime()) / 1000) : null

  const entry = await entryRepo.createEntry({
    description: data.description ?? '',
    projectId: data.projectId ?? null,
    taskId: data.taskId ?? null,
    tagId,
    userId,
    workspaceId,
    startTime: start,
    endTime: end,
    duration,
    isRunning,
    billable: data.billable ?? false,
  })

  invalidateStatsCache(userId)
  return entry
}

export async function stopEntry(id: string, userId: string, workspaceId: string, endTime?: Date) {
  const entry = await entryRepo.findEntryById(id, userId, workspaceId)
  if (!entry) return null
  if (!entry.isRunning) return entry

  const end = endTime ?? new Date()
  const duration = Math.floor((end.getTime() - new Date(entry.startTime).getTime()) / 1000)
  const updated = await entryRepo.stopOne(id, userId, workspaceId, end, duration)
  invalidateStatsCache(userId)
  return updated
}

export async function updateEntry(id: string, userId: string, workspaceId: string, data: {
  description?: string
  projectId?: string | null
  taskId?: string | null
  tagId?: string | null
  tag?: string | null
  billable?: boolean
  startTime?: string
  endTime?: string | null
}) {
  const entry = await entryRepo.findEntryById(id, userId, workspaceId)
  if (!entry) return null

  let tagId = entry.tagId
  if (data.tagId !== undefined || data.tag !== undefined) {
    if (data.tagId === null || data.tag === null) {
      tagId = null
    } else {
      const t = await resolveActiveTagForUser(userId, { tagId: data.tagId, tag: data.tag })
      tagId = t?.id ?? null
    }
  }

  const start = data.startTime ? new Date(data.startTime) : new Date(entry.startTime)
  const end = data.endTime !== undefined
    ? (data.endTime ? new Date(data.endTime) : null)
    : entry.endTime
  const duration = end
    ? Math.floor((end.getTime() - start.getTime()) / 1000) + entry.pausedDuration
    : null

  const updated = await entryRepo.updateEntry(id, userId, workspaceId, {
    ...(data.description !== undefined && { description: data.description }),
    ...(data.projectId !== undefined && { projectId: data.projectId ?? null }),
    ...(data.taskId !== undefined && { taskId: data.taskId ?? null }),
    ...(data.billable !== undefined && { billable: data.billable }),
    tagId,
    startTime: start,
    endTime: end,
    duration,
    isRunning: !end && !entry.isPaused,
  })

  invalidateStatsCache(userId)
  return updated
}

export async function updateAccessibleEntry(id: string, user: { userId: string; role: Role }, workspaceId: string, data: {
  description?: string
  projectId?: string | null
  taskId?: string | null
  tagId?: string | null
  tag?: string | null
  billable?: boolean
  startTime?: string
  endTime?: string | null
}) {
  const entry = await entryRepo.findAccessibleEntryById(id, user, workspaceId)
  if (!entry) return null

  if (data.projectId) {
    const allowed = await canAccessProject(user, data.projectId, ['TRACK', 'MANAGE', 'APPROVE'], workspaceId)
    if (!allowed) throw new Error('Forbidden')
  }

  let tagId = entry.tagId
  if (data.tagId !== undefined || data.tag !== undefined) {
    if (data.tagId === null || data.tag === null) {
      tagId = null
    } else {
      const t = await resolveActiveTagForUser(entry.userId, { tagId: data.tagId, tag: data.tag })
      tagId = t?.id ?? null
    }
  }

  const start = data.startTime ? new Date(data.startTime) : new Date(entry.startTime)
  const end = data.endTime !== undefined
    ? (data.endTime ? new Date(data.endTime) : null)
    : entry.endTime
  const duration = end
    ? Math.floor((end.getTime() - start.getTime()) / 1000) + entry.pausedDuration
    : null

  const updated = await entryRepo.updateEntryById(id, workspaceId, {
    ...(data.description !== undefined && { description: data.description }),
    ...(data.projectId !== undefined && { projectId: data.projectId ?? null }),
    ...(data.taskId !== undefined && { taskId: data.taskId ?? null }),
    ...(data.billable !== undefined && { billable: data.billable }),
    tagId,
    startTime: start,
    endTime: end,
    duration,
    isRunning: !end && !entry.isPaused,
  })

  invalidateStatsCache(entry.userId)
  if (entry.userId !== user.userId) invalidateStatsCache(user.userId)
  return updated
}

export async function pauseEntry(id: string, userId: string, workspaceId: string) {
  const entry = await entryRepo.findEntryById(id, userId, workspaceId)
  if (!entry || !entry.isRunning) return null

  const now = new Date()
  const elapsed = Math.floor((now.getTime() - new Date(entry.startTime).getTime()) / 1000)
  const pausedDuration = entry.pausedDuration + elapsed

  const updated = await entryRepo.pauseOne(id, userId, workspaceId, pausedDuration)
  invalidateStatsCache(userId)
  return updated
}

export async function resumeEntry(id: string, userId: string, workspaceId: string) {
  const entry = await entryRepo.findEntryById(id, userId, workspaceId)
  if (!entry || !entry.isPaused) return null

  // Stop any other running timer first
  await entryRepo.stopRunning(userId, workspaceId, new Date())

  const updated = await entryRepo.resumeOne(id, userId, workspaceId, new Date())
  invalidateStatsCache(userId)
  return updated
}

export async function deleteEntry(id: string, userId: string, workspaceId: string) {
  const entry = await entryRepo.findEntryById(id, userId, workspaceId)
  if (!entry) return null
  await entryRepo.deleteEntry(id, userId, workspaceId)
  invalidateStatsCache(userId)
  return true
}

export async function deleteAccessibleEntry(id: string, user: { userId: string; role: Role }, workspaceId: string) {
  const entry = await entryRepo.findAccessibleEntryById(id, user, workspaceId)
  if (!entry) return null
  await entryRepo.deleteEntryById(id, workspaceId)
  invalidateStatsCache(entry.userId)
  if (entry.userId !== user.userId) invalidateStatsCache(user.userId)
  return true
}
