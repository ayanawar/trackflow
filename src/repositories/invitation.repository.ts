import prisma from '@/lib/prisma'

export async function findInvitationsByOrg(orgId: string) {
  return prisma.invitation.findMany({ // workspace-scope-exempt: legacy org-level invitation management
    where: { orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findInvitationByToken(token: string) {
  return prisma.invitation.findUnique({ // workspace-scope-exempt: token lookup before workspace is known
    where: { token },
    include: { organization: { select: { id: true, name: true, slug: true, avatarUrl: true } } },
  })
}

export async function findInvitationByEmailAndOrg(email: string, orgId: string) {
  return prisma.invitation.findUnique({ where: { email_orgId: { email, orgId } } }) // workspace-scope-exempt: duplicate check is org-level by contract
}

export async function createInvitation(data: {
  email: string
  orgId: string
  workspaceId: string
  role: string
  expiresAt: Date
}) {
  return prisma.invitation.create({ data })
}

export async function findInvitationsByWorkspace(workspaceId: string) {
  return prisma.invitation.findMany({
    where: { workspaceId, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function acceptInvitation(token: string) {
  return prisma.invitation.update({ where: { token }, data: { acceptedAt: new Date() } }) // workspace-scope-exempt: token lookup before workspace is known
}

export async function deleteInvitation(id: string, orgId: string) {
  return prisma.invitation.delete({ where: { id, orgId } }) // workspace-scope-exempt: legacy org-level invitation cancellation
}
