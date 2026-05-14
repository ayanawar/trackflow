import prisma from '@/lib/prisma'
import type { Prisma, SecurityEventType } from '@prisma/client'

export async function create(data: {
  type: SecurityEventType
  userId?: string | null
  email?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown> | null
}) {
  const createData: Prisma.SecurityEventUncheckedCreateInput = {
    type: data.type,
    ...(data.userId && { userId: data.userId }),
    ...(data.email && { email: data.email }),
    ...(data.ipAddress && { ipAddress: data.ipAddress }),
    ...(data.userAgent && { userAgent: data.userAgent }),
    ...(data.metadata && { metadata: data.metadata as Prisma.InputJsonObject }),
  }
  return prisma.securityEvent.create({ data: createData })
}

export async function findRecent(limit = 100) {
  return prisma.securityEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 500),
  })
}
