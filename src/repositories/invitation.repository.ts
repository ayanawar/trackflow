import prisma from '@/lib/prisma'

export async function findInvitationsByOrg(orgId: string) {
  return prisma.invitation.findMany({
    where: { orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findInvitationByToken(token: string) {
  return prisma.invitation.findUnique({
    where: { token },
    include: { organization: { select: { id: true, name: true, slug: true, avatarUrl: true } } },
  })
}

export async function findInvitationByEmailAndOrg(email: string, orgId: string) {
  return prisma.invitation.findUnique({ where: { email_orgId: { email, orgId } } })
}

export async function createInvitation(data: {
  email: string
  orgId: string
  role: string
  expiresAt: Date
}) {
  return prisma.invitation.create({ data })
}

export async function acceptInvitation(token: string) {
  return prisma.invitation.update({ where: { token }, data: { acceptedAt: new Date() } })
}

export async function deleteInvitation(id: string, orgId: string) {
  return prisma.invitation.delete({ where: { id, orgId } })
}
