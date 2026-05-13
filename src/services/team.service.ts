import * as teamRepo from '@/repositories/team.repository'
import * as orgRepo from '@/repositories/organization.repository'
import { hasRole } from '@/lib/roles'

async function getMembership(userId: string, orgId: string) {
  return orgRepo.findMembership(userId, orgId)
}

export async function listTeams(orgId: string, userId: string) {
  const membership = await getMembership(userId, orgId)
  if (!membership) return null
  return teamRepo.findTeamsByOrg(orgId)
}

export async function getTeam(orgId: string, teamId: string, userId: string) {
  const membership = await getMembership(userId, orgId)
  if (!membership) return null
  return teamRepo.findTeamById(teamId, orgId)
}

export async function createTeam(
  orgId: string,
  userId: string,
  data: { name: string; description?: string | null }
) {
  const membership = await getMembership(userId, orgId)
  if (!membership || !hasRole(membership.role, 'MANAGER')) return { error: 'Forbidden' }
  return { team: await teamRepo.createTeam({ ...data, orgId }) }
}

export async function updateTeam(
  orgId: string,
  teamId: string,
  userId: string,
  data: { name?: string; description?: string | null }
) {
  const membership = await getMembership(userId, orgId)
  if (!membership || !hasRole(membership.role, 'MANAGER')) return null
  const team = await teamRepo.findTeamById(teamId, orgId)
  if (!team) return null
  return teamRepo.updateTeam(teamId, orgId, data)
}

export async function deleteTeam(orgId: string, teamId: string, userId: string) {
  const membership = await getMembership(userId, orgId)
  if (!membership || !hasRole(membership.role, 'ADMIN')) return false
  const team = await teamRepo.findTeamById(teamId, orgId)
  if (!team) return false
  await teamRepo.deleteTeam(teamId, orgId)
  return true
}

export async function addMemberToTeam(orgId: string, teamId: string, actorId: string, targetUserId: string) {
  const actorMembership = await getMembership(actorId, orgId)
  if (!actorMembership || !hasRole(actorMembership.role, 'MANAGER')) return { error: 'Forbidden' }

  const targetMembership = await getMembership(targetUserId, orgId)
  if (!targetMembership) return { error: 'User is not a member of this organization' }

  const team = await teamRepo.findTeamById(teamId, orgId)
  if (!team) return { error: 'Team not found' }

  return { member: await teamRepo.addTeamMember(targetUserId, teamId) }
}

export async function removeMemberFromTeam(orgId: string, teamId: string, actorId: string, targetUserId: string) {
  const actorMembership = await getMembership(actorId, orgId)
  const isSelf = actorId === targetUserId

  if (!actorMembership) return false
  if (!isSelf && !hasRole(actorMembership.role, 'MANAGER')) return false

  const existing = await teamRepo.findTeamMember(targetUserId, teamId)
  if (!existing) return false

  await teamRepo.removeTeamMember(targetUserId, teamId)
  return true
}
