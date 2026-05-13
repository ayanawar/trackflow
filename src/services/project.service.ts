import * as projectRepo from '@/repositories/project.repository'
import { canAccessProject } from '@/services/authorization.service'
import type { Role } from '@/types'

export async function listProjects(userId: string) {
  return projectRepo.findAllByUser(userId)
}

export async function listAccessibleProjects(user: { userId: string; role: Role }) {
  return projectRepo.findAllAccessible(user)
}

export async function getProject(id: string, userId: string) {
  return projectRepo.findProjectById(id, userId)
}

export async function getAccessibleProject(id: string, user: { userId: string; role: Role }) {
  const allowed = await canAccessProject(user, id)
  if (!allowed) return null
  return projectRepo.findById(id)
}

export async function createProject(userId: string, data: {
  name: string
  client?: string | null
  color: string
}) {
  return projectRepo.createProject({ ...data, userId })
}

export async function updateProject(id: string, userId: string, data: {
  name?: string
  client?: string | null
  color?: string
}) {
  const p = await projectRepo.findProjectById(id, userId)
  if (!p) return null
  return projectRepo.updateProject(id, userId, data)
}

export async function updateAccessibleProject(id: string, user: { userId: string; role: Role }, data: {
  name?: string
  client?: string | null
  clientId?: string | null
  color?: string
}) {
  const allowed = await canAccessProject(user, id, ['MANAGE', 'APPROVE'])
  if (!allowed) return null
  return projectRepo.updateProject(id, user.userId, data)
}

export async function deleteAccessibleProject(id: string, user: { userId: string; role: Role }) {
  const allowed = await canAccessProject(user, id, ['MANAGE'])
  if (!allowed) return null
  return projectRepo.deleteProject(id, user.userId)
}

export async function deleteProject(id: string, userId: string) {
  const p = await projectRepo.findProjectById(id, userId)
  if (!p) return null
  return projectRepo.deleteProject(id, userId)
}
