import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'
import * as userRepo from '@/repositories/user.repository'
import * as refreshTokenRepo from '@/repositories/refreshToken.repository'
import * as passwordResetTokenRepo from '@/repositories/passwordResetToken.repository'
import * as inviteTokenRepo from '@/repositories/inviteToken.repository'
import { recordSecurityEvent } from '@/services/securityEvent.service'
import { sendPasswordResetEmail, sendInviteEmail } from '@/lib/mailer'
import { buildAppUrl } from '@/lib/appUrl'
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

export async function register(data: {
  name: string
  email: string
  password: string
  workspace: string
}) {
  const existing = await userRepo.findByEmail(data.email)
  if (existing) throw new Error('Email already in use')
  const hashed = await bcrypt.hash(data.password, 12)
  const user = await userRepo.createUserWithRole({ ...data, password: hashed, role: 'ADMIN' })
  const rawRefreshToken = await createRefreshToken(user.id)
  return { user, rawRefreshToken }
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
      workspace: user.workspace,
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

export async function googleAuth(idToken: string) {
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
    return { user: byGoogleId, rawRefreshToken }
  }

  const byEmail = await userRepo.findByEmail(email!)
  if (byEmail) throw new Error('An account with this email already exists. Please sign in with your email and password.')

  const user = await userRepo.createGoogleUser({
    googleId: googleId!,
    email: email!,
    name: name ?? email!,
    avatarUrl: avatarUrl ?? null,
    workspace: 'My Workspace',
    role: 'ADMIN',
  })
  const rawRefreshToken = await createRefreshToken(user.id)
  return { user, rawRefreshToken }
}

export async function forgotPassword(email: string, appBaseUrl?: string) {
  const user = await userRepo.findByEmail(email)
  if (!user) return // prevent enumeration — return silently

  const raw = generateRawToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
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

export async function updateMe(userId: string, data: { name?: string; workspace?: string; dailyHoursGoal?: number }) {
  return userRepo.updateUser(userId, data)
}

export async function createInvite(invitedById: string, email: string, role: string, appBaseUrl?: string) {
  const existing = await userRepo.findByEmail(email)
  if (existing) throw new Error('A user with this email already exists')

  await inviteTokenRepo.deleteByEmail(email)

  const raw = generateRawToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  await inviteTokenRepo.create({ tokenHash: hashToken(raw), email, role: role as Role, invitedById, expiresAt })

  const inviter = await userRepo.findById(invitedById)
  const inviteUrl = buildAppUrl(`/auth/invite?token=${raw}`, appBaseUrl)

  await sendInviteEmail(email, raw, {
    inviterName: inviter?.name ?? 'Someone',
    workspace: inviter?.workspace ?? 'My Workspace',
    role,
    appBaseUrl,
  })

  return { inviteUrl, email, role }
}

export async function getInvite(rawToken: string) {
  const record = await inviteTokenRepo.findByHash(hashToken(rawToken))
  if (!record) throw new Error('Invalid or expired invite')
  if (record.usedAt !== null) throw new Error('Invite already used')
  if (record.expiresAt < new Date()) throw new Error('Invalid or expired invite')
  const inviter = await userRepo.findById(record.invitedById)
  return { email: record.email, role: record.role, workspace: inviter?.workspace ?? 'My Workspace' }
}

export async function acceptInvite(rawToken: string, data: { name: string; password: string }) {
  const tokenHash = hashToken(rawToken)
  const record = await inviteTokenRepo.findByHash(tokenHash)

  if (!record) throw new Error('Invalid or expired invite')
  if (record.usedAt !== null) throw new Error('Invite already used')
  if (record.expiresAt < new Date()) throw new Error('Invalid or expired invite')

  const existing = await userRepo.findByEmail(record.email)
  if (existing) throw new Error('An account with this email already exists')
  const inviter = await userRepo.findById(record.invitedById)

  const hashed = await bcrypt.hash(data.password, 12)
  const user = await userRepo.createUserWithRole({
    name: data.name,
    email: record.email,
    password: hashed,
    workspace: inviter?.workspace ?? 'My Workspace',
    role: record.role as Role,
  })

  await inviteTokenRepo.markUsed(record.id)
  const rawRefreshToken = await createRefreshToken(user.id)
  return { user, rawRefreshToken }
}
