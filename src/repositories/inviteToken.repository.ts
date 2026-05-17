import prisma from '@/lib/prisma'
import type { Role } from '@/types'

export async function create(data: {
  tokenHash: string
  email: string
  role: Role
  invitedById: string
  workspaceId: string
  expiresAt: Date
}) {
  return prisma.inviteToken.create({ data })
}

export async function findByHash(tokenHash: string) {
  return prisma.inviteToken.findUnique({ where: { tokenHash } })
}

export async function markUsed(id: string) {
  return prisma.inviteToken.update({ where: { id }, data: { usedAt: new Date() } })
}

export async function deleteByEmail(email: string) {
  return prisma.inviteToken.deleteMany({ where: { email, usedAt: null } })
}
