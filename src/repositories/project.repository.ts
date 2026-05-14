import prisma from '@/lib/prisma'
import { projectAccessWhere } from '@/services/authorization.service'
import type { Role } from '@/types'

const include = {
  _count: { select: { timeEntries: true } },
  timeEntries: { select: { duration: true }, where: { duration: { not: null } } },
} as const

export type ProjectRow = Awaited<ReturnType<typeof findAllByUser>>[number]

export async function findAllByUser(userId: string) {
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include,
  })
  return projects.map(p => ({
    id: p.id,
    name: p.name,
    client: p.client,
    color: p.color,
    userId: p.userId,
    createdAt: p.createdAt,
    entryCount: p._count.timeEntries,
    totalSeconds: p.timeEntries.reduce((s, e) => s + (e.duration ?? 0), 0),
  }))
}

export async function findAllAccessible(user: { userId: string; role: Role }) {
  const where = await projectAccessWhere(user)
  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { ...include, clientRef: true },
  })
  return projects.map(p => ({
    id: p.id,
    name: p.name,
    client: p.clientRef?.name ?? p.client,
    clientId: p.clientId,
    color: p.color,
    userId: p.userId,
    createdAt: p.createdAt,
    entryCount: p._count.timeEntries,
    totalSeconds: p.timeEntries.reduce((s, e) => s + (e.duration ?? 0), 0),
  }))
}

export async function findProjectById(id: string, userId: string) {
  const p = await prisma.project.findUnique({ where: { id } })
  if (!p || p.userId !== userId) return null
  return p
}

export async function findById(id: string) {
  return prisma.project.findUnique({ where: { id }, include: { clientRef: true } })
}

export async function createProject(data: {
  name: string
  client?: string | null
  clientId?: string | null
  color: string
  userId: string
}) {
  return prisma.project.create({ data })
}

export async function updateProject(
  id: string,
  userId: string,
  data: { name?: string; client?: string | null; clientId?: string | null; color?: string }
) {
  return prisma.project.update({ where: { id }, data })
}

export async function deleteProject(id: string, userId: string) {
  return prisma.project.delete({ where: { id } })
}
