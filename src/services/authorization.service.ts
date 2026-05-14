import prisma from '@/lib/prisma'
import type { Role } from '@/types'

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

export async function canAccessProject(user: { userId: string; role: Role }, projectId: string, levels: string[] = ['VIEW', 'TRACK', 'MANAGE', 'APPROVE']) {
  if (user.role === 'ADMIN') return true
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } })
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

export async function canAccessClient(user: { userId: string; role: Role }, clientId: string, levels: string[] = ['VIEW', 'MANAGE', 'REPORT']) {
  if (user.role === 'ADMIN') return true
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { createdById: true } })
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

export async function projectAccessWhere(user: { userId: string; role: Role }) {
  if (user.role === 'ADMIN') return {}
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

export async function timeEntryAccessWhere(user: { userId: string; role: Role }) {
  if (user.role === 'ADMIN') return {}
  if (user.role === 'EMPLOYEE') return { userId: user.userId }
  const projectWhere = await projectAccessWhere(user)
  return {
    OR: [
      { userId: user.userId },
      { project: projectWhere },
    ],
  }
}
