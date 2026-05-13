import prisma from '@/lib/prisma'

const include = { project: true, tag: true } as const

export async function findAllByUser(userId: string, limit = 100) {
  return prisma.timeEntry.findMany({
    where: { userId },
    orderBy: { startTime: 'desc' },
    take: Math.min(limit, 500),
    include,
  })
}

export async function findEntryById(id: string, userId: string) {
  const e = await prisma.timeEntry.findUnique({ where: { id }, include })
  if (!e || e.userId !== userId) return null
  return e
}

export async function findRunning(userId: string) {
  return prisma.timeEntry.findFirst({ where: { userId, isRunning: true }, include })
}

export async function createEntry(data: {
  description: string
  projectId: string | null
  tagId: string | null
  userId: string
  startTime: Date
  endTime: Date | null
  duration: number | null
  isRunning: boolean
}) {
  return prisma.timeEntry.create({ data, include })
}

export async function updateEntry(
  id: string,
  userId: string,
  data: {
    description?: string
    projectId?: string | null
    tagId?: string | null
    startTime?: Date
    endTime?: Date | null
    duration?: number | null
    isRunning?: boolean
  }
) {
  return prisma.timeEntry.update({ where: { id, userId }, data, include })
}

export async function stopRunning(userId: string, endTime: Date) {
  return prisma.timeEntry.updateMany({
    where: { userId, isRunning: true },
    data: { endTime, isRunning: false },
  })
}

export async function stopOne(id: string, userId: string, endTime: Date, durationSeconds: number) {
  return prisma.timeEntry.update({
    where: { id, userId },
    data: { endTime, duration: durationSeconds, isRunning: false },
    include,
  })
}

export async function deleteEntry(id: string, userId: string) {
  return prisma.timeEntry.delete({ where: { id, userId } })
}
