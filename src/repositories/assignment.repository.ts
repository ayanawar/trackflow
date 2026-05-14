import prisma from '@/lib/prisma'

export async function upsertProjectAssignment(data: {
  projectId: string
  userId?: string | null
  teamId?: string | null
  accessLevel: 'VIEW' | 'TRACK' | 'MANAGE' | 'APPROVE'
}) {
  if (data.userId) {
    return prisma.projectAssignment.upsert({
      where: { projectId_userId: { projectId: data.projectId, userId: data.userId } },
      update: { accessLevel: data.accessLevel },
      create: data,
    })
  }
  if (data.teamId) {
    return prisma.projectAssignment.upsert({
      where: { projectId_teamId: { projectId: data.projectId, teamId: data.teamId } },
      update: { accessLevel: data.accessLevel },
      create: data,
    })
  }
  throw new Error('Provide userId or teamId')
}

export async function upsertClientAssignment(data: {
  clientId: string
  userId?: string | null
  teamId?: string | null
  accessLevel: 'VIEW' | 'MANAGE' | 'REPORT'
}) {
  if (data.userId) {
    return prisma.clientAssignment.upsert({
      where: { clientId_userId: { clientId: data.clientId, userId: data.userId } },
      update: { accessLevel: data.accessLevel },
      create: data,
    })
  }
  if (data.teamId) {
    return prisma.clientAssignment.upsert({
      where: { clientId_teamId: { clientId: data.clientId, teamId: data.teamId } },
      update: { accessLevel: data.accessLevel },
      create: data,
    })
  }
  throw new Error('Provide userId or teamId')
}

export async function findProjectAssignmentsForUser(userId: string) {
  const teams = await prisma.teamMember.findMany({ where: { userId }, select: { teamId: true } })
  const teamIds = teams.map(t => t.teamId)
  return prisma.projectAssignment.findMany({
    where: { OR: [{ userId }, { teamId: { in: teamIds } }] },
  })
}

export async function findClientAssignmentsForUser(userId: string) {
  const teams = await prisma.teamMember.findMany({ where: { userId }, select: { teamId: true } })
  const teamIds = teams.map(t => t.teamId)
  return prisma.clientAssignment.findMany({
    where: { OR: [{ userId }, { teamId: { in: teamIds } }] },
  })
}
