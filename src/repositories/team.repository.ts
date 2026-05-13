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

export async function create(data: { name: string; description?: string | null; createdById: string }) {
  return prisma.team.create({ data })
}

export async function update(id: string, data: { name?: string; description?: string | null }) {
  return prisma.team.update({ where: { id }, data })
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
