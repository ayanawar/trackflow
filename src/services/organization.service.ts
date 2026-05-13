import * as orgRepo from '@/repositories/organization.repository'
import { hasRole } from '@/lib/roles'

export async function listUserOrgs(userId: string) {
  const memberships = await orgRepo.findOrgsByUser(userId)
  return memberships.map(m => ({
    ...m.organization,
    role: m.role,
  }))
}

export async function getOrg(orgId: string, userId: string) {
  const membership = await orgRepo.findMembership(userId, orgId)
  if (!membership) return null
  return orgRepo.findOrgById(orgId)
}

export async function createOrg(userId: string, data: { name: string; slug: string }) {
  const existing = await orgRepo.findOrgBySlug(data.slug)
  if (existing) return { error: 'Slug is already taken' }

  const org = await orgRepo.createOrg(data)
  await orgRepo.createMembership(userId, org.id, 'OWNER')
  await orgRepo.setActiveOrg(userId, org.id)
  return { org }
}

export async function updateOrg(
  orgId: string,
  userId: string,
  data: { name?: string; avatarUrl?: string | null }
) {
  const membership = await orgRepo.findMembership(userId, orgId)
  if (!membership || !hasRole(membership.role, 'ADMIN')) return null
  return orgRepo.updateOrg(orgId, data)
}

export async function deleteOrg(orgId: string, userId: string) {
  const membership = await orgRepo.findMembership(userId, orgId)
  if (!membership || membership.role !== 'OWNER') return false
  await orgRepo.deleteOrg(orgId)
  return true
}

export async function switchOrg(userId: string, orgId: string) {
  const membership = await orgRepo.findMembership(userId, orgId)
  if (!membership) return false
  await orgRepo.setActiveOrg(userId, orgId)
  return true
}

export async function listMembers(orgId: string, userId: string) {
  const membership = await orgRepo.findMembership(userId, orgId)
  if (!membership) return null
  const org = await orgRepo.findOrgById(orgId)
  return org?.memberships ?? null
}

export async function updateMemberRole(
  orgId: string,
  actorId: string,
  targetUserId: string,
  newRole: string
) {
  const actorMembership = await orgRepo.findMembership(actorId, orgId)
  if (!actorMembership || !hasRole(actorMembership.role, 'ADMIN')) return { error: 'Forbidden' }

  const targetMembership = await orgRepo.findMembership(targetUserId, orgId)
  if (!targetMembership) return { error: 'Member not found' }
  if (targetMembership.role === 'OWNER') return { error: 'Cannot change owner role' }
  if (newRole === 'OWNER') return { error: 'Cannot assign owner role' }

  return { membership: await orgRepo.updateMembership(targetUserId, orgId, newRole) }
}

export async function removeMember(orgId: string, actorId: string, targetUserId: string) {
  const actorMembership = await orgRepo.findMembership(actorId, orgId)
  const isSelf = actorId === targetUserId

  if (!actorMembership) return { error: 'Forbidden' }
  if (!isSelf && !hasRole(actorMembership.role, 'ADMIN')) return { error: 'Forbidden' }

  const targetMembership = await orgRepo.findMembership(targetUserId, orgId)
  if (!targetMembership) return { error: 'Member not found' }
  if (targetMembership.role === 'OWNER') return { error: 'Cannot remove the owner' }

  await orgRepo.deleteMembership(targetUserId, orgId)
  return { ok: true }
}
