import prisma from '@/lib/prisma'

export async function create(data: {
  tokenHash: string
  userId: string
  family: string
  expiresAt: Date
}) {
  return prisma.refreshToken.create({ data })
}

export async function findByHash(tokenHash: string) {
  return prisma.refreshToken.findUnique({ where: { tokenHash } })
}

export async function revokeOne(id: string) {
  return prisma.refreshToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  })
}

export async function revokeFamily(family: string) {
  return prisma.refreshToken.updateMany({
    where: { family, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllForUser(userId: string) {
  return prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
