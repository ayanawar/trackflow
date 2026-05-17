import prisma from '@/lib/prisma'
import * as workspaceRepo from '@/repositories/workspace.repository'
import type { Role } from '@/types'

/**
 * Workspace-level permission helpers.
 */
export async function canAccessWorkspace(userId: string, workspaceId: string): Promise<boolean> {
  return (await workspaceRepo.isMember(workspaceId, userId)) !== null
}

export async function canManageWorkspace(userId: string, workspaceId: string): Promise<boolean> {
  // Workspace ADMIN (direct membership) OR org owner/admin (implicit via isMember -> 'ADMIN')
  return (await workspaceRepo.isMember(workspaceId, userId)) === 'ADMIN'
}

export async function canDeleteWorkspace(userId: string, workspaceId: string): Promise<boolean> {
  // Only org owner/admin can delete (FR-022).
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { orgId: true },
  })
  if (!ws) return false
  const m = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId: ws.orgId } },
    select: { role: true },
  })
  return m?.role === 'OWNER' || m?.role === 'ADMIN'
}


export function isAdmin(role: Role | string) {
  return role === 'ADMIN'
}

export function isManagerOrAdmin(role: Role | string) {
  return role === 'ADMIN' || role === 'MANAGER'
}

export async function getUserTeamIds(userId: string) {
  const memberships = await prisma.teamMember.findMany({ where: { userId }, select: { teamId: true } })
  return memberships.map(m => m.teamId)
}

export async function canAccessProject(user: { userId: string; role: Role }, projectId: string, levels: string[] = ['VIEW', 'TRACK', 'MANAGE', 'APPROVE'], workspaceId?: string) {
  if (user.role === 'ADMIN') {
    if (!workspaceId) return true
    const project = await prisma.project.findFirst({ where: { id: projectId, workspaceId }, select: { id: true } })
    return Boolean(project)
  }
  const project = workspaceId
    ? await prisma.project.findFirst({ where: { id: projectId, workspaceId }, select: { userId: true } })
    : await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } })
  if (project?.userId === user.userId) return true
  const teamIds = await getUserTeamIds(user.userId)
  const assignment = await prisma.projectAssignment.findFirst({
    where: {
      projectId,
      accessLevel: { in: levels as any[] },
      OR: [{ userId: user.userId }, { teamId: { in: teamIds } }],
    },
  })
  return Boolean(assignment)
}

export async function canAccessClient(user: { userId: string; role: Role }, clientId: string, levels: string[] = ['VIEW', 'MANAGE', 'REPORT'], workspaceId?: string) {
  if (user.role === 'ADMIN') {
    if (!workspaceId) return true
    const client = await prisma.client.findFirst({ where: { id: clientId, workspaceId }, select: { id: true } })
    return Boolean(client)
  }
  const client = workspaceId
    ? await prisma.client.findFirst({ where: { id: clientId, workspaceId }, select: { createdById: true } })
    : await prisma.client.findUnique({ where: { id: clientId }, select: { createdById: true } })
  if (client?.createdById === user.userId) return true
  const teamIds = await getUserTeamIds(user.userId)
  const assignment = await prisma.clientAssignment.findFirst({
    where: {
      clientId,
      accessLevel: { in: levels as any[] },
      OR: [{ userId: user.userId }, { teamId: { in: teamIds } }],
    },
  })
  return Boolean(assignment)
}

export async function projectAccessWhere(user: { userId: string; role: Role }, workspaceId?: string) {
  if (user.role === 'ADMIN') return workspaceId ? { workspaceId } : {}
  const teamIds = await getUserTeamIds(user.userId)
  return {
    OR: [
      { userId: user.userId },
      { projectAssignments: { some: { userId: user.userId } } },
      { projectAssignments: { some: { teamId: { in: teamIds } } } },
      { clientRef: { clientAssignments: { some: { userId: user.userId } } } },
      { clientRef: { clientAssignments: { some: { teamId: { in: teamIds } } } } },
    ],
  }
}

export async function timeEntryAccessWhere(user: { userId: string; role: Role }, workspaceId?: string) {
  if (user.role === 'ADMIN') return workspaceId ? { workspaceId } : {}
  if (user.role === 'EMPLOYEE') return { userId: user.userId, ...(workspaceId ? { workspaceId } : {}) }
  const projectWhere = await projectAccessWhere(user, workspaceId)
  return {
    ...(workspaceId ? { workspaceId } : {}),
    OR: [
      { userId: user.userId },
      { project: projectWhere },
    ],
  }
}
