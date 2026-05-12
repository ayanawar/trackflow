import * as entryRepo from '@/repositories/timeEntry.repository'
import * as tagRepo from '@/repositories/tag.repository'
import { invalidateStatsCache } from '@/services/stats.service'

export async function listEntries(userId: string, limit = 100) {
  return entryRepo.findAllByUser(userId, limit)
}

export async function getEntry(id: string, userId: string) {
  return entryRepo.findEntryById(id, userId)
}

export async function createEntry(userId: string, data: {
  description?: string
  projectId?: string | null
  tag?: string | null
  startTime: string
  endTime?: string | null
}) {
  await entryRepo.stopRunning(userId, new Date())

  let tagId: string | null = null
  if (data.tag) {
    const t = await tagRepo.upsertByName(data.tag, userId)
    tagId = t.id
  }

  const isRunning = !data.endTime
  const start = new Date(data.startTime)
  const end = data.endTime ? new Date(data.endTime) : null
  const duration = end ? Math.floor((end.getTime() - start.getTime()) / 1000) : null

  const entry = await entryRepo.createEntry({
    description: data.description ?? '',
    projectId: data.projectId ?? null,
    tagId,
    userId,
    startTime: start,
    endTime: end,
    duration,
    isRunning,
  })

  invalidateStatsCache(userId)
  return entry
}

export async function stopEntry(id: string, userId: string, endTime?: Date) {
  const entry = await entryRepo.findEntryById(id, userId)
  if (!entry) return null
  if (!entry.isRunning) return entry

  const end = endTime ?? new Date()
  const duration = Math.floor((end.getTime() - new Date(entry.startTime).getTime()) / 1000)
  const updated = await entryRepo.stopOne(id, userId, end, duration)
  invalidateStatsCache(userId)
  return updated
}

export async function updateEntry(id: string, userId: string, data: {
  description?: string
  projectId?: string | null
  tag?: string | null
  startTime?: string
  endTime?: string | null
}) {
  const entry = await entryRepo.findEntryById(id, userId)
  if (!entry) return null

  let tagId = entry.tagId
  if (data.tag !== undefined) {
    if (data.tag === null) {
      tagId = null
    } else {
      const t = await tagRepo.upsertByName(data.tag, userId)
      tagId = t.id
    }
  }

  const start = data.startTime ? new Date(data.startTime) : new Date(entry.startTime)
  const end = data.endTime !== undefined
    ? (data.endTime ? new Date(data.endTime) : null)
    : entry.endTime
  const duration = end ? Math.floor((end.getTime() - start.getTime()) / 1000) : null

  const updated = await entryRepo.updateEntry(id, userId, {
    ...(data.description !== undefined && { description: data.description }),
    ...(data.projectId !== undefined && { projectId: data.projectId ?? null }),
    tagId,
    startTime: start,
    endTime: end,
    duration,
    isRunning: !end,
  })

  invalidateStatsCache(userId)
  return updated
}

export async function deleteEntry(id: string, userId: string) {
  const entry = await entryRepo.findEntryById(id, userId)
  if (!entry) return null
  await entryRepo.deleteEntry(id, userId)
  invalidateStatsCache(userId)
  return true
}
