import prisma from '@/lib/prisma'
import type { Role } from '@/types'

const select = {
  id: true,
  name: true,
  email: true,
  workspace: true,
  dailyHoursGoal: true,
  activeOrgId: true,
  role: true,
  createdAt: true,
}

export async function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function findById(id: string) {
  return prisma.user.findUnique({ where: { id }, select })
}

export async function findAll() {
  return prisma.user.findMany({ select, orderBy: { createdAt: 'asc' } })
}

export async function findAllByWorkspace(workspace: string) {
  return prisma.user.findMany({ where: { workspace }, select, orderBy: { createdAt: 'asc' } })
}

export async function findByIdInWorkspace(id: string, workspace: string) {
  return prisma.user.findFirst({ where: { id, workspace }, select })
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  workspace: string
}) {
  return prisma.user.create({ data, select })
}

export async function createUserWithRole(data: {
  name: string
  email: string
  password: string
  workspace: string
  role: Role
}) {
  return prisma.user.create({ data, select })
}

export async function updateUser(id: string, data: { name?: string; workspace?: string; dailyHoursGoal?: number; role?: Role }) {
  return prisma.user.update({ where: { id }, data, select })
}

export async function updatePassword(id: string, hashedPassword: string) {
  await prisma.user.update({ where: { id }, data: { password: hashedPassword } })
}

export async function updateRole(id: string, role: Role) {
  return prisma.user.update({ where: { id }, data: { role }, select })
}

export async function createAdminUser(data: {
  name: string
  email: string
  password?: string
  workspace: string
  role: Role
}) {
  return prisma.user.create({ data, select })
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
  workspace?: string
  role?: Role
}) {
  return prisma.user.create({
    data: {
      googleId: data.googleId,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatarUrl,
      password: null,
      workspace: data.workspace ?? 'My Workspace',
      role: data.role ?? 'EMPLOYEE',
    },
    select: googleSelect,
  })
}
