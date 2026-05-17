import prisma from '@/lib/prisma'
import type { WorkspaceRole } from '@prisma/client'

export async function create(data: {
  workspaceId: string
  userId: string
  role?: WorkspaceRole
}) {
  return prisma.workspaceMembership.create({
    data: { workspaceId: data.workspaceId, userId: data.userId, role: data.role ?? 'MEMBER' },
  })
}

export async function findByUserAndWorkspace(userId: string, workspaceId: string) {
  return prisma.workspaceMembership.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  })
}

export async function listByWorkspace(workspaceId: string) {
  return prisma.workspaceMembership.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  })
}

export async function countByUser(userId: string): Promise<number> {
  return prisma.workspaceMembership.count({ where: { userId } })
}

export async function remove(workspaceId: string, userId: string) {
  return prisma.workspaceMembership.delete({
    where: { workspaceId_userId: { workspaceId, userId } },
  })
}
