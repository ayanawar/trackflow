import prisma from '@/lib/prisma'

export async function findTeamsByOrg(orgId: string) {
  return prisma.team.findMany({
    where: { orgId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function findTeamById(id: string, orgId: string) {
  return prisma.team.findFirst({
    where: { id, orgId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      },
    },
  })
}

export async function createTeam(data: { name: string; description?: string | null; orgId: string }) {
  return prisma.team.create({ data })
}

export async function updateTeam(id: string, orgId: string, data: { name?: string; description?: string | null }) {
  return prisma.team.update({ where: { id, orgId }, data })
}

export async function deleteTeam(id: string, orgId: string) {
  return prisma.team.delete({ where: { id, orgId } })
}

export async function addTeamMember(userId: string, teamId: string) {
  return prisma.teamMember.upsert({
    where: { userId_teamId: { userId, teamId } },
    create: { userId, teamId },
    update: {},
  })
}

export async function removeTeamMember(userId: string, teamId: string) {
  return prisma.teamMember.delete({ where: { userId_teamId: { userId, teamId } } })
}

export async function findTeamMember(userId: string, teamId: string) {
  return prisma.teamMember.findUnique({ where: { userId_teamId: { userId, teamId } } })
}
