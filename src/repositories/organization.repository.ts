import prisma from '@/lib/prisma'

export async function findOrgsByUser(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    include: {
      organization: true,
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function findOrgById(id: string) {
  return prisma.organization.findUnique({
    where: { id },
    include: {
      memberships: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
      teams: { include: { members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } } } },
    },
  })
}

export async function findOrgBySlug(slug: string) {
  return prisma.organization.findUnique({ where: { slug } })
}

export async function createOrg(data: { name: string; slug: string; avatarUrl?: string | null }) {
  return prisma.organization.create({ data })
}

export async function updateOrg(id: string, data: { name?: string; avatarUrl?: string | null }) {
  return prisma.organization.update({ where: { id }, data })
}

export async function deleteOrg(id: string) {
  return prisma.organization.delete({ where: { id } })
}

export async function findMembership(userId: string, orgId: string) {
  return prisma.membership.findUnique({ where: { userId_orgId: { userId, orgId } } })
}

export async function createMembership(userId: string, orgId: string, role: string) {
  return prisma.membership.create({ data: { userId, orgId, role } })
}

export async function updateMembership(userId: string, orgId: string, role: string) {
  return prisma.membership.update({ where: { userId_orgId: { userId, orgId } }, data: { role } })
}

export async function deleteMembership(userId: string, orgId: string) {
  return prisma.membership.delete({ where: { userId_orgId: { userId, orgId } } })
}

export async function setActiveOrg(userId: string, activeOrgId: string | null) {
  return prisma.user.update({ where: { id: userId }, data: { activeOrgId } })
}
