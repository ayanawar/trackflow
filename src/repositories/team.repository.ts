import prisma from '@/lib/prisma'

export async function findAll() {
  return prisma.team.findMany({
    orderBy: { createdAt: 'desc' },
    include: { members: { include: { user: true } }, _count: { select: { members: true } } },
  })
}

export async function findById(id: string) {
  return prisma.team.findUnique({ where: { id }, include: { members: true } })
}

export async function create(data: { name: string; description?: string | null; createdById?: string | null }) {
  return prisma.team.create({ data })
}

export async function update(id: string, data: { name?: string; description?: string | null }) {
  return prisma.team.update({ where: { id }, data })
}

export async function deleteById(id: string) {
  return prisma.team.delete({ where: { id } })
}

export async function upsertMember(data: { teamId: string; userId: string; memberRole: 'MANAGER' | 'MEMBER' }) {
  return prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: data.teamId, userId: data.userId } },
    update: { memberRole: data.memberRole },
    create: data,
  })
}

export async function removeMember(teamId: string, userId: string) {
  return prisma.teamMember.delete({ where: { teamId_userId: { teamId, userId } } })
}

export async function findTeamIdsForUser(userId: string) {
  const rows = await prisma.teamMember.findMany({ where: { userId }, select: { teamId: true } })
  return rows.map(row => row.teamId)
}


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
