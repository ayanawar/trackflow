import * as assignmentRepo from '@/repositories/assignment.repository'

export async function assignProject(projectId: string, data: {
  userId?: string | null
  teamId?: string | null
  accessLevel: 'VIEW' | 'TRACK' | 'MANAGE' | 'APPROVE'
}) {
  return assignmentRepo.upsertProjectAssignment({ projectId, ...data })
}

export async function assignClient(clientId: string, data: {
  userId?: string | null
  teamId?: string | null
  accessLevel: 'VIEW' | 'MANAGE' | 'REPORT'
}) {
  return assignmentRepo.upsertClientAssignment({ clientId, ...data })
}
