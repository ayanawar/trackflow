import * as clientRepo from '@/repositories/client.repository'

export async function listClients() {
  return clientRepo.findAll()
}

export async function createClient(createdById: string, data: { name: string; description?: string | null }) {
  return clientRepo.create({ ...data, createdById })
}

export async function updateClient(id: string, data: { name?: string; description?: string | null }) {
  return clientRepo.update(id, data)
}
