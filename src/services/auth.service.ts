import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'
import prisma from '@/lib/prisma'
import * as userRepo from '@/repositories/user.repository'
import * as orgRepo from '@/repositories/organization.repository'
import * as workspaceRepo from '@/repositories/workspace.repository'
import * as refreshTokenRepo from '@/repositories/refreshToken.repository'
import * as passwordResetTokenRepo from '@/repositories/passwordResetToken.repository'
import * as inviteTokenRepo from '@/repositories/inviteToken.repository'
import { recordSecurityEvent } from '@/services/securityEvent.service'
import { canManageWorkspace } from '@/services/authorization.service'
import { sendPasswordResetEmail, sendInviteEmail } from '@/lib/mailer'
import { buildAppUrl } from '@/lib/appUrl'
import { signSetupToken, verifySetupToken } from '@/lib/googleSetupToken'
import type { Role } from '@/types'

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

function generateRawToken(): string {
  return randomBytes(32).toString('hex')
}

async function createRefreshToken(userId: string) {
  const raw = generateRawToken()
  const family = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  await refreshTokenRepo.create({ tokenHash: hashToken(raw), userId, family, expiresAt })
  return raw
}

/** Email + password signup with required Organization + Workspace Name. */
export async function register(data: {
  name: string
  email: string
  password: string
  organizationName: string
  workspaceName: string
}) {
  const existing = await userRepo.findByEmail(data.email)
  if (existing) throw new Error('Email already in use')
  const hashed = await bcrypt.hash(data.password, 12)

  const result = await prisma.$transaction(async _tx => {
    // 1) Create user
    const user = await userRepo.createUserWithRole({
      name: data.name,
      email: data.email,
      password: hashed,
      role: 'ADMIN',
    })
    // 2) Create org + first workspace + memberships atomically
    const { workspaceId } = await orgRepo.createWithOwnerAndWorkspace({
      orgName: data.organizationName,
      workspaceName: data.workspaceName,
      ownerUserId: user.id,
    })
    // 3) Pin active workspace
    const withWs = await userRepo.setActiveWorkspace(user.id, workspaceId)
    return withWs
  })

  const rawRefreshToken = await createRefreshToken(result.id)
  return { user: result, rawRefreshToken }
}

export async function login(email: string, password: string) {
  const user = await userRepo.findByEmail(email)
  if (!user || !user.password) throw new Error('Invalid credentials')
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new Error('Invalid credentials')
  const rawRefreshToken = await createRefreshToken(user.id)
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      activeWorkspaceId: user.activeWorkspaceId,
      activeOrgId: user.activeOrgId,
      role: user.role,
      dailyHoursGoal: user.dailyHoursGoal,
    },
    rawRefreshToken,
  }
}

export async function logout(rawRefreshToken?: string) {
  if (!rawRefreshToken) return
  const record = await refreshTokenRepo.findByHash(hashToken(rawRefreshToken))
  if (record) await refreshTokenRepo.revokeOne(record.id)
}

export async function refresh(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken)
  const record = await refreshTokenRepo.findByHash(tokenHash)

  if (!record) throw new Error('Invalid or expired refresh token')

  if (record.revokedAt !== null) {
    await recordSecurityEvent({ type: 'REFRESH_REUSED', userId: record.userId })
    await refreshTokenRepo.revokeFamily(record.family)
    throw new Error('Session invalidated')
  }

  if (record.expiresAt < new Date()) {
    await refreshTokenRepo.revokeOne(record.id)
    throw new Error('Invalid or expired refresh token')
  }

  await refreshTokenRepo.revokeOne(record.id)

  const user = await userRepo.findById(record.userId)
  if (!user) throw new Error('Invalid or expired refresh token')

  const newRaw = generateRawToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await refreshTokenRepo.create({
    tokenHash: hashToken(newRaw),
    userId: record.userId,
    family: record.family,
    expiresAt,
  })

  return { user, rawRefreshToken: newRaw }
}

/**
 * Google sign-in / sign-up entry point.
 * - Existing user (by googleId OR email): returns AUTHENTICATED + tokens.
 * - New user: returns NEEDS_SETUP + a short-lived setup token (no DB rows
 *   created). The client must POST /api/auth/google/complete with org/workspace
 *   names to finalize.
 */
export async function googleAuth(idToken: string): Promise<
  | { status: 'AUTHENTICATED'; user: Awaited<ReturnType<typeof userRepo.findByGoogleId>>; rawRefreshToken: string }
  | { status: 'NEEDS_SETUP'; setupToken: string; hints: { suggestedWorkspaceName: string } }
> {
  const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
  let payload
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    })
    payload = ticket.getPayload()
  } catch {
    throw new Error('Invalid Google token')
  }

  if (!payload) throw new Error('Invalid Google token')
  if (!payload.email_verified) throw new Error('Google account email is not verified.')

  const { sub: googleId, email, name, picture: avatarUrl } = payload

  const byGoogleId = await userRepo.findByGoogleId(googleId!)
  if (byGoogleId) {
    const rawRefreshToken = await createRefreshToken(byGoogleId.id)
    return { status: 'AUTHENTICATED', user: byGoogleId, rawRefreshToken }
  }

  const byEmail = await userRepo.findByEmail(email!)
  if (byEmail) {
    throw new Error(
      'An account with this email already exists. Please sign in with your email and password.',
    )
  }

  // No DB rows yet — issue a short-lived setup token for the completion screen.
  const setupToken = await signSetupToken({
    googleId: googleId!,
    email: email!,
    name: name ?? email!,
    avatarUrl: avatarUrl ?? null,
  })
  const firstName = (name ?? email!).split(/[\s@]/)[0] || 'My'
  return {
    status: 'NEEDS_SETUP',
    setupToken,
    hints: { suggestedWorkspaceName: `${firstName} Workspace` },
  }
}

/**
 * Finalize a Google signup. Verifies the setup token, atomically creates
 * User + Organization + Workspace + memberships, returns tokens.
 */
export async function completeGoogleSignup(data: {
  setupToken: string
  organizationName: string
  workspaceName: string
}) {
  const decoded = await verifySetupToken(data.setupToken)
  if (!decoded) throw new Error('Setup link expired — please sign in with Google again')

  // Race protection: someone may have created the account in the meantime.
  const byGoogleId = await userRepo.findByGoogleId(decoded.googleId)
  if (byGoogleId) throw Object.assign(new Error('Account already exists'), { code: 'CONFLICT' })
  const byEmail = await userRepo.findByEmail(decoded.email)
  if (byEmail) throw Object.assign(new Error('Account already exists'), { code: 'CONFLICT' })

  const user = await userRepo.createGoogleUser({
    googleId: decoded.googleId,
    email: decoded.email,
    name: decoded.name,
    avatarUrl: decoded.avatarUrl,
    role: 'ADMIN',
  })
  const { workspaceId } = await orgRepo.createWithOwnerAndWorkspace({
    orgName: data.organizationName,
    workspaceName: data.workspaceName,
    ownerUserId: user.id,
  })
  const finalized = await userRepo.setActiveWorkspace(user.id, workspaceId)

  const rawRefreshToken = await createRefreshToken(finalized.id)
  return { user: finalized, rawRefreshToken }
}

export async function forgotPassword(email: string, appBaseUrl?: string) {
  const user = await userRepo.findByEmail(email)
  if (!user) return // prevent enumeration

  const raw = generateRawToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
  await passwordResetTokenRepo.create({ tokenHash: hashToken(raw), userId: user.id, expiresAt })

  await sendPasswordResetEmail(email, raw, appBaseUrl)
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const tokenHash = hashToken(rawToken)
  const record = await passwordResetTokenRepo.findByHash(tokenHash)

  if (!record) throw new Error('Invalid or expired reset token')
  if (record.usedAt !== null) throw new Error('Invalid or expired reset token')
  if (record.expiresAt < new Date()) throw new Error('Invalid or expired reset token')

  await passwordResetTokenRepo.markUsed(record.id)

  const hashed = await bcrypt.hash(newPassword, 12)
  await userRepo.updatePassword(record.userId, hashed)
  await refreshTokenRepo.revokeAllForUser(record.userId)
}

export async function getMe(userId: string) {
  return userRepo.findById(userId)
}

export async function updateMe(userId: string, data: { name?: string; dailyHoursGoal?: number }) {
  return userRepo.updateUser(userId, data)
}

/**
 * Workspace-scoped invitation. The caller must be able to manage the target
 * workspace (org owner/admin OR workspace admin).
 */
export async function createInvite(
  invitedById: string,
  email: string,
  role: string,
  workspaceId: string,
  appBaseUrl?: string,
) {
  const existing = await userRepo.findByEmail(email)
  if (existing) throw new Error('A user with this email already exists')

  const allowed = await canManageWorkspace(invitedById, workspaceId)
  if (!allowed) throw Object.assign(new Error('Cannot invite into this workspace'), { code: 'FORBIDDEN' })

  await inviteTokenRepo.deleteByEmail(email)

  const raw = generateRawToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  await inviteTokenRepo.create({
    tokenHash: hashToken(raw),
    email,
    role: role as Role,
    invitedById,
    workspaceId,
    expiresAt,
  })

  const inviter = await userRepo.findById(invitedById)
  const workspace = await workspaceRepo.findById(workspaceId)
  const inviteUrl = buildAppUrl(`/auth/invite?token=${raw}`, appBaseUrl)

  await sendInviteEmail(email, raw, {
    inviterName: inviter?.name ?? 'Someone',
    workspace: workspace?.name ?? 'a workspace',
    role,
    appBaseUrl,
  })

  return { inviteUrl, email, role, workspaceId }
}

export async function getInvite(rawToken: string) {
  const record = await inviteTokenRepo.findByHash(hashToken(rawToken))
  if (!record) throw new Error('Invalid or expired invite')
  if (record.usedAt !== null) throw new Error('Invite already used')
  if (record.expiresAt < new Date()) throw new Error('Invalid or expired invite')
  const workspace = record.workspaceId ? await workspaceRepo.findById(record.workspaceId) : null
  return {
    email: record.email,
    role: record.role,
    workspaceId: record.workspaceId,
    workspace: workspace?.name ?? 'a workspace',
  }
}

export async function acceptInvite(rawToken: string, data: { name: string; password: string }) {
  const tokenHash = hashToken(rawToken)
  const record = await inviteTokenRepo.findByHash(tokenHash)

  if (!record) throw new Error('Invalid or expired invite')
  if (record.usedAt !== null) throw new Error('Invite already used')
  if (record.expiresAt < new Date()) throw new Error('Invalid or expired invite')
  if (!record.workspaceId) throw new Error('Invite has no workspace target')

  const existing = await userRepo.findByEmail(record.email)
  if (existing) throw new Error('An account with this email already exists')

  const workspace = await workspaceRepo.findById(record.workspaceId)
  if (!workspace) throw new Error('Invited workspace no longer exists')

  const hashed = await bcrypt.hash(data.password, 12)

  const finalized = await prisma.$transaction(async tx => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: record.email,
        password: hashed,
        role: record.role,
      },
    })
    // Org-level membership (implicit, MEMBER role)
    await tx.membership.upsert({
      where: { userId_orgId: { userId: user.id, orgId: workspace.orgId } },
      update: {},
      create: { userId: user.id, orgId: workspace.orgId, role: 'MEMBER' },
    })
    // Workspace membership
    await tx.workspaceMembership.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
      update: {},
      create: { workspaceId: workspace.id, userId: user.id, role: 'MEMBER' },
    })
    return tx.user.update({
      where: { id: user.id },
      data: { activeWorkspaceId: workspace.id, activeOrgId: workspace.orgId },
    })
  })

  await inviteTokenRepo.markUsed(record.id)
  const rawRefreshToken = await createRefreshToken(finalized.id)
  return { user: finalized, rawRefreshToken }
}
