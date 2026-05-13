import * as teamRepo from '@/repositories/team.repository'

export async function listTeams() {
  return teamRepo.findAll()
}

export async function createTeam(createdById: string, data: { name: string; description?: string | null }) {
  return teamRepo.create({ ...data, createdById })
}

export async function updateTeam(id: string, data: { name?: string; description?: string | null }) {
  return teamRepo.update(id, data)
}

export async function upsertTeamMember(teamId: string, data: { userId: string; memberRole: 'MANAGER' | 'MEMBER' }) {
  return teamRepo.upsertMember({ teamId, ...data })
}

export async function removeTeamMember(teamId: string, userId: string) {
  return teamRepo.removeMember(teamId, userId)
}
