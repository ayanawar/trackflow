import prisma from '@/lib/prisma'
import type { Role } from '@/types'

const select = {
  id: true,
  name: true,
  email: true,
  dailyHoursGoal: true,
  activeOrgId: true,
  activeWorkspaceId: true,
  role: true,
  createdAt: true,
}

const googleSelect = { ...select, avatarUrl: true }

export async function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function findById(id: string) {
  return prisma.user.findUnique({ where: { id }, select })
}

export async function findAll() {
  return prisma.user.findMany({ select, orderBy: { createdAt: 'asc' } })
}

/**
 * List users who are members of the given workspace via WorkspaceMembership.
 */
export async function findAllByWorkspaceId(workspaceId: string) {
  return prisma.user.findMany({
    where: { workspaceMemberships: { some: { workspaceId } } },
    select,
    orderBy: { createdAt: 'asc' },
  })
}

export async function findByIdInWorkspace(id: string, workspaceId: string) {
  return prisma.user.findFirst({
    where: { id, workspaceMemberships: { some: { workspaceId } } },
    select,
  })
}

export async function createUser(data: { name: string; email: string; password: string }) {
  return prisma.user.create({ data, select })
}

export async function createUserWithRole(data: {
  name: string
  email: string
  password: string
  role: Role
}) {
  return prisma.user.create({ data, select })
}

export async function updateUser(
  id: string,
  data: { name?: string; dailyHoursGoal?: number; role?: Role }
) {
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
  role: Role
}) {
  return prisma.user.create({ data, select })
}

export async function findByGoogleId(googleId: string) {
  return prisma.user.findUnique({ where: { googleId }, select: googleSelect })
}

export async function createGoogleUser(data: {
  googleId: string
  email: string
  name: string
  avatarUrl: string | null
  role?: Role
}) {
  return prisma.user.create({
    data: {
      googleId: data.googleId,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatarUrl,
      password: null,
      role: data.role ?? 'EMPLOYEE',
    },
    select: googleSelect,
  })
}

export async function setActiveWorkspace(userId: string, workspaceId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { activeWorkspaceId: workspaceId },
    select,
  })
}
