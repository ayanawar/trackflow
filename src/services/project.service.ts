import * as projectRepo from '@/repositories/project.repository'

export async function listProjects(userId: string) {
  return projectRepo.findAllByUser(userId)
}

export async function getProject(id: string, userId: string) {
  return projectRepo.findProjectById(id, userId)
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

export async function deleteProject(id: string, userId: string) {
  const p = await projectRepo.findProjectById(id, userId)
  if (!p) return null
  return projectRepo.deleteProject(id, userId)
}
