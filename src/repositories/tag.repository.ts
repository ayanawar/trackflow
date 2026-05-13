import prisma from '@/lib/prisma'

export async function findAllByUser(userId: string) {
  return prisma.tag.findMany({ where: { userId }, orderBy: { name: 'asc' } })
}

export async function upsertByName(name: string, userId: string) {
  return prisma.tag.upsert({
    where: { name_userId: { name, userId } },
    update: {},
    create: { name, userId },
  })
}

export async function findTagById(id: string, userId: string) {
  const t = await prisma.tag.findUnique({ where: { id } })
  if (!t || t.userId !== userId) return null
  return t
}

export async function deleteTag(id: string, userId: string) {
  return prisma.tag.delete({ where: { id, userId } })
}
