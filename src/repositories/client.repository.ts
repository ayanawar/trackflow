import prisma from '@/lib/prisma'

export async function findAll() {
  return prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { projects: true, clientAssignments: true } } },
  })
}

export async function findById(id: string) {
  return prisma.client.findUnique({ where: { id } })
}

export async function create(data: { name: string; description?: string | null; createdById: string }) {
  return prisma.client.create({ data })
}

export async function update(id: string, data: { name?: string; description?: string | null }) {
  return prisma.client.update({ where: { id }, data })
}
