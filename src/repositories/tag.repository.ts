import type { Prisma, TagStatus } from '@prisma/client'
import prisma from '@/lib/prisma'

const tagInclude = {
  _count: { select: { timeEntries: true } },
} as const

export type TagWithUsage = Prisma.TagGetPayload<{ include: typeof tagInclude }>

export async function getWorkspaceKeyForUser(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeOrgId: true, workspace: true },
  })
  if (!user) return null
  return user.activeOrgId ? `org:${user.activeOrgId}` : `workspace:${user.workspace || 'My Workspace'}`
}

export async function findAllByWorkspace(
  workspaceId: string,
  options: { status?: TagStatus | 'ALL'; query?: string; includeUsage?: boolean } = {}
) {
  const where: Prisma.TagWhereInput = {
    workspaceId,
    ...(options.status && options.status !== 'ALL' ? { status: options.status } : {}),
    ...(options.query ? { name: { contains: options.query, mode: 'insensitive' } } : {}),
  }

  return prisma.tag.findMany({
    where,
    orderBy: { name: 'asc' },
    ...(options.includeUsage ? { include: tagInclude } : {}),
  })
}

export async function findAllByUser(userId: string) {
  const workspaceId = await getWorkspaceKeyForUser(userId)
  if (!workspaceId) return []
  return findAllByWorkspace(workspaceId, { status: 'ACTIVE' })
}

export async function findByNormalizedName(workspaceId: string, normalizedName: string) {
  return prisma.tag.findFirst({
    where: { workspaceId, normalizedName },
    include: tagInclude,
  })
}

export async function createTag(data: {
  name: string
  normalizedName: string
  color: string
  workspaceId: string
  userId: string
}) {
  return prisma.tag.create({
    data: {
      name: data.name,
      normalizedName: data.normalizedName,
      color: data.color,
      workspaceId: data.workspaceId,
      userId: data.userId,
      updatedById: data.userId,
    },
    include: tagInclude,
  })
}

export async function findTagById(id: string, workspaceId: string) {
  return prisma.tag.findFirst({ where: { id, workspaceId }, include: tagInclude })
}

export async function findActiveTagById(id: string, workspaceId: string) {
  return prisma.tag.findFirst({ where: { id, workspaceId, status: 'ACTIVE' } })
}

export async function updateTag(
  id: string,
  workspaceId: string,
  data: {
    name?: string
    normalizedName?: string
    color?: string
    status?: TagStatus
    updatedById: string
  }
) {
  return prisma.tag.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.normalizedName !== undefined && { normalizedName: data.normalizedName }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.status !== undefined && { status: data.status }),
      updatedById: data.updatedById,
    },
    include: tagInclude,
  })
}

export async function countTagUsage(id: string) {
  return prisma.timeEntry.count({ where: { tagId: id } })
}

export async function deleteTag(id: string, workspaceId: string) {
  await findTagById(id, workspaceId)
  return prisma.tag.delete({ where: { id } })
}

export async function reassignTagReferences(fromTagIds: string[], toTagId: string) {
  if (fromTagIds.length === 0) return { count: 0 }
  return prisma.timeEntry.updateMany({
    where: { tagId: { in: fromTagIds } },
    data: { tagId: toTagId },
  })
}
