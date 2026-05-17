import * as clientRepo from '@/repositories/client.repository'

export async function listClients(workspaceId: string) {
  return clientRepo.findAllByWorkspace(workspaceId)
}

export async function createClient(createdById: string, workspaceId: string, data: { name: string; description?: string | null }) {
  return clientRepo.create({ ...data, workspaceId, createdById })
}

export async function updateClient(id: string, workspaceId: string, data: { name?: string; description?: string | null }) {
  return clientRepo.update(id, workspaceId, data)
}
