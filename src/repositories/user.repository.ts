import prisma from '@/lib/prisma'

const select = { id: true, name: true, email: true, workspace: true, dailyHoursGoal: true, activeOrgId: true, createdAt: true }

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

export async function updateUser(id: string, data: { name?: string; workspace?: string; dailyHoursGoal?: number }) {
  return prisma.user.update({ where: { id }, data, select })
}

const googleSelect = { ...select, avatarUrl: true }

export async function findByGoogleId(googleId: string) {
  return prisma.user.findUnique({ where: { googleId }, select: googleSelect })
}

export async function createGoogleUser(data: {
  googleId: string
  email: string
  name: string
  avatarUrl: string | null
}) {
  return prisma.user.create({
    data: { ...data, password: null, workspace: 'My Workspace' },
    select: googleSelect,
  })
}
