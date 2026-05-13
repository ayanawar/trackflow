import * as inviteRepo from '@/repositories/invitation.repository'
import * as orgRepo from '@/repositories/organization.repository'
import { hasRole } from '@/lib/roles'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function listInvitations(orgId: string, userId: string) {
  const membership = await orgRepo.findMembership(userId, orgId)
  if (!membership || !hasRole(membership.role, 'ADMIN')) return null
  return inviteRepo.findInvitationsByOrg(orgId)
}

export async function createInvitation(
  orgId: string,
  actorId: string,
  data: { email: string; role: string }
) {
  const actorMembership = await orgRepo.findMembership(actorId, orgId)
  if (!actorMembership || !hasRole(actorMembership.role, 'ADMIN')) return { error: 'Forbidden' }

  const existing = await inviteRepo.findInvitationByEmailAndOrg(data.email, orgId)
  if (existing && !existing.acceptedAt && existing.expiresAt > new Date()) {
    return { error: 'An active invitation already exists for this email' }
  }

  const expiresAt = new Date(Date.now() + INVITE_TTL_MS)
  const invitation = await inviteRepo.createInvitation({ ...data, orgId, expiresAt })
  return { invitation }
}

export async function getInvitationByToken(token: string) {
  const invitation = await inviteRepo.findInvitationByToken(token)
  if (!invitation) return null
  if (invitation.acceptedAt) return { error: 'Invitation already accepted' }
  if (invitation.expiresAt < new Date()) return { error: 'Invitation has expired' }
  return { invitation }
}

export async function acceptInvitation(token: string, userId: string, userEmail: string) {
  const invitation = await inviteRepo.findInvitationByToken(token)
  if (!invitation) return { error: 'Invalid invitation' }
  if (invitation.acceptedAt) return { error: 'Invitation already accepted' }
  if (invitation.expiresAt < new Date()) return { error: 'Invitation has expired' }
  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    return { error: 'This invitation was sent to a different email address' }
  }

  const existing = await orgRepo.findMembership(userId, invitation.orgId)
  if (existing) return { error: 'You are already a member of this organization' }

  await orgRepo.createMembership(userId, invitation.orgId, invitation.role)
  await inviteRepo.acceptInvitation(token)
  await orgRepo.setActiveOrg(userId, invitation.orgId)

  return { orgId: invitation.orgId }
}

export async function cancelInvitation(orgId: string, inviteId: string, actorId: string) {
  const membership = await orgRepo.findMembership(actorId, orgId)
  if (!membership || !hasRole(membership.role, 'ADMIN')) return false
  await inviteRepo.deleteInvitation(inviteId, orgId)
  return true
}
