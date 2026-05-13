import prisma from '@/lib/prisma'

export async function create(data: {
  tokenHash: string
  userId: string
  expiresAt: Date
}) {
  return prisma.passwordResetToken.create({ data })
}

export async function findByHash(tokenHash: string) {
  return prisma.passwordResetToken.findUnique({ where: { tokenHash } })
}

export async function markUsed(id: string) {
  return prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  })
}
