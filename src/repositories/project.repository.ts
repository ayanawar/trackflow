import prisma from '@/lib/prisma'
import { projectAccessWhere } from '@/services/authorization.service'
import type { Role } from '@/types'

const include = {
  _count: { select: { timeEntries: true } },
  timeEntries: { select: { duration: true }, where: { duration: { not: null } } },
} as const

const includeWithAssignments = {
  ...include,
  projectAssignments: {
    include: { user: { select: { id: true, name: true } } },
  },
} as const

export type ProjectRow = Awaited<ReturnType<typeof findAllByUser>>[number]

export async function findAllByUser(userId: string, workspaceId: string) {
  const projects = await prisma.project.findMany({
    where: { userId, workspaceId },
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

export async function findAllAccessible(user: { userId: string; role: Role }, workspaceId: string) {
  const where = await projectAccessWhere(user, workspaceId)
  const projects = await prisma.project.findMany({
    where: { AND: [where, { workspaceId }] },
    orderBy: { createdAt: 'desc' },
    include: { ...includeWithAssignments, clientRef: true },
  })
  return projects.map(p => ({
    id: p.id,
    name: p.name,
    client: p.clientRef?.name ?? p.client,
    clientId: p.clientId,
    color: p.color,
    status: p.status,
    userId: p.userId,
    createdAt: p.createdAt,
    entryCount: p._count.timeEntries,
    totalSeconds: p.timeEntries.reduce((s, e) => s + (e.duration ?? 0), 0),
    assignments: p.projectAssignments.map(a => ({
      id: a.id,
      userId: a.userId,
      user: a.user,
      accessLevel: a.accessLevel,
    })),
  }))
}

export async function findProjectById(id: string, userId: string, workspaceId: string) {
  const p = await prisma.project.findFirst({ where: { id, workspaceId } })
  if (!p || p.userId !== userId) return null
  return p
}

export async function findById(id: string, workspaceId: string) {
  return prisma.project.findFirst({ where: { id, workspaceId }, include: { clientRef: true } })
}

export async function createProject(data: {
  name: string
  client?: string | null
  clientId?: string | null
  color: string
  userId: string
  workspaceId: string
}) {
  return prisma.project.create({ data })
}

export async function updateProject(
  id: string,
  userId: string,
  workspaceId: string,
  data: { name?: string; client?: string | null; clientId?: string | null; color?: string; status?: string }
) {
  await prisma.project.findFirstOrThrow({ where: { id, workspaceId } })
  return prisma.project.update({ where: { id }, data: data as Parameters<typeof prisma.project.update>[0]['data'] })
}

export async function deleteProject(id: string, userId: string, workspaceId: string) {
  await prisma.project.findFirstOrThrow({ where: { id, workspaceId } })
  return prisma.project.delete({ where: { id } })
}
