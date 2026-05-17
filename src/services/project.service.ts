import * as projectRepo from '@/repositories/project.repository'
import { canAccessProject } from '@/services/authorization.service'
import type { Role } from '@/types'

export async function listProjects(userId: string, workspaceId: string) {
  return projectRepo.findAllByUser(userId, workspaceId)
}

export async function listAccessibleProjects(user: { userId: string; role: Role }, workspaceId: string) {
  return projectRepo.findAllAccessible(user, workspaceId)
}

export async function getProject(id: string, userId: string, workspaceId: string) {
  return projectRepo.findProjectById(id, userId, workspaceId)
}

export async function getAccessibleProject(id: string, user: { userId: string; role: Role }, workspaceId: string) {
  const allowed = await canAccessProject(user, id, undefined, workspaceId)
  if (!allowed) return null
  return projectRepo.findById(id, workspaceId)
}

export async function createProject(userId: string, workspaceId: string, data: {
  name: string
  client?: string | null
  color: string
}) {
  return projectRepo.createProject({ ...data, userId, workspaceId })
}

export async function updateProject(id: string, userId: string, workspaceId: string, data: {
  name?: string
  client?: string | null
  color?: string
}) {
  const p = await projectRepo.findProjectById(id, userId, workspaceId)
  if (!p) return null
  return projectRepo.updateProject(id, userId, workspaceId, data)
}

export async function updateAccessibleProject(id: string, user: { userId: string; role: Role }, workspaceId: string, data: {
  name?: string
  client?: string | null
  clientId?: string | null
  color?: string
}) {
  const allowed = await canAccessProject(user, id, ['MANAGE', 'APPROVE'], workspaceId)
  if (!allowed) return null
  return projectRepo.updateProject(id, user.userId, workspaceId, data)
}

export async function deleteAccessibleProject(id: string, user: { userId: string; role: Role }, workspaceId: string) {
  const allowed = await canAccessProject(user, id, ['MANAGE'], workspaceId)
  if (!allowed) return null
  return projectRepo.deleteProject(id, user.userId, workspaceId)
}

export async function deleteProject(id: string, userId: string, workspaceId: string) {
  const p = await projectRepo.findProjectById(id, userId, workspaceId)
  if (!p) return null
  return projectRepo.deleteProject(id, userId, workspaceId)
}
