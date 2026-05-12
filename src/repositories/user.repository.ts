import prisma from '@/lib/prisma'

const select = { id: true, name: true, email: true, workspace: true, createdAt: true }

export async function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function findById(id: string) {
  return prisma.user.findUnique({ where: { id }, select })
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  workspace: string
}) {
  return prisma.user.create({ data, select })
}

export async function updateUser(id: string, data: { name?: string; workspace?: string }) {
  return prisma.user.update({ where: { id }, data, select })
}
