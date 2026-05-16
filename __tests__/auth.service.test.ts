import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all repository modules before importing the service
vi.mock('@/repositories/user.repository', () => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  createUser: vi.fn(),
  createUserWithRole: vi.fn(),
  updatePassword: vi.fn(),
}))
vi.mock('@/repositories/refreshToken.repository', () => ({
  create: vi.fn(),
  findByHash: vi.fn(),
  revokeOne: vi.fn(),
  revokeFamily: vi.fn(),
  revokeAllForUser: vi.fn(),
}))
vi.mock('@/repositories/passwordResetToken.repository', () => ({
  create: vi.fn(),
  findByHash: vi.fn(),
  markUsed: vi.fn(),
}))
vi.mock('@/repositories/inviteToken.repository', () => ({
  create: vi.fn(),
  findByHash: vi.fn(),
  markUsed: vi.fn(),
  deleteByEmail: vi.fn(),
}))
vi.mock('@/lib/mailer', () => ({
  sendPasswordResetEmail: vi.fn(),
  sendInviteEmail: vi.fn(),
}))
vi.mock('google-auth-library')

import * as userRepo from '@/repositories/user.repository'
import * as refreshTokenRepo from '@/repositories/refreshToken.repository'
import * as passwordResetTokenRepo from '@/repositories/passwordResetToken.repository'
import * as inviteTokenRepo from '@/repositories/inviteToken.repository'
import { register, login, logout, forgotPassword, resetPassword } from '@/services/auth.service'

const mockUser = {
  id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
  workspace: 'Test Workspace',
  role: 'EMPLOYEE',
  dailyHoursGoal: 8,
  createdAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

// ------- register -------

describe('register', () => {
  it('creates a user and returns rawRefreshToken', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null)
    vi.mocked(userRepo.createUserWithRole).mockResolvedValue({ ...mockUser, role: 'ADMIN' })
    vi.mocked(refreshTokenRepo.create).mockResolvedValue({} as any)

    const result = await register({ name: 'Test', email: 'test@example.com', password: 'password123', workspace: 'WS' })

    expect(userRepo.findByEmail).toHaveBeenCalledWith('test@example.com')
    expect(userRepo.createUserWithRole).toHaveBeenCalledWith(expect.objectContaining({ role: 'ADMIN' }))
    expect(result.user.id).toBe('user1')
    expect(typeof result.rawRefreshToken).toBe('string')
    expect(result.rawRefreshToken.length).toBeGreaterThan(10)
  })

  it('throws if email already exists', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(mockUser as any)
    await expect(
      register({ name: 'Test', email: 'test@example.com', password: 'password123', workspace: 'WS' })
    ).rejects.toThrow('Email already in use')
  })

  it('stores hashed password, not plain text', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null)
    vi.mocked(userRepo.createUserWithRole).mockImplementation(async (data) => {
      expect(data.password).not.toBe('password123')
      expect(data.password.startsWith('$2')).toBe(true)
      expect(data.role).toBe('ADMIN')
      return { ...mockUser, role: 'ADMIN' }
    })
    vi.mocked(refreshTokenRepo.create).mockResolvedValue({} as any)
    await register({ name: 'T', email: 'a@b.com', password: 'password123', workspace: 'W' })
  })
})

// ------- login -------

describe('login', () => {
  it('throws on unknown email', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null)
    await expect(login('unknown@example.com', 'password')).rejects.toThrow('Invalid credentials')
  })

  it('throws on wrong password', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue({
      ...mockUser,
      password: '$2a$12$invalidhash',
    } as any)
    await expect(login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials')
  })

  it('returns user with dailyHoursGoal on success', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('correct', 12)
    vi.mocked(userRepo.findByEmail).mockResolvedValue({ ...mockUser, password: hash } as any)
    vi.mocked(refreshTokenRepo.create).mockResolvedValue({} as any)

    const result = await login('test@example.com', 'correct')
    expect(result.user.dailyHoursGoal).toBe(8)
    expect(result.user.email).toBe('test@example.com')
    expect(typeof result.rawRefreshToken).toBe('string')
  })

  it('throws if user has no password (Google account)', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue({ ...mockUser, password: null } as any)
    await expect(login('test@example.com', 'anything')).rejects.toThrow('Invalid credentials')
  })
})

// ------- logout -------

describe('logout', () => {
  it('does nothing if no token provided', async () => {
    await logout(undefined)
    expect(refreshTokenRepo.findByHash).not.toHaveBeenCalled()
  })

  it('revokes the token if found', async () => {
    vi.mocked(refreshTokenRepo.findByHash).mockResolvedValue({ id: 'rt1' } as any)
    vi.mocked(refreshTokenRepo.revokeOne).mockResolvedValue({} as any)
    await logout('rawtoken')
    expect(refreshTokenRepo.revokeOne).toHaveBeenCalledWith('rt1')
  })

  it('does nothing if token not found in DB', async () => {
    vi.mocked(refreshTokenRepo.findByHash).mockResolvedValue(null)
    await logout('rawtoken')
    expect(refreshTokenRepo.revokeOne).not.toHaveBeenCalled()
  })
})

// ------- forgotPassword -------

describe('forgotPassword', () => {
  it('creates a reset token for existing user', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(mockUser as any)
    vi.mocked(passwordResetTokenRepo.create).mockResolvedValue({} as any)

    await forgotPassword('test@example.com')

    expect(passwordResetTokenRepo.create).toHaveBeenCalledOnce()
    const call = vi.mocked(passwordResetTokenRepo.create).mock.calls[0][0]
    expect(call.userId).toBe('user1')
    expect(call.tokenHash).not.toContain(' ')
    expect(call.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })

  it('silently does nothing for non-existent email (anti-enumeration)', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null)
    await expect(forgotPassword('nobody@example.com')).resolves.toBeUndefined()
    expect(passwordResetTokenRepo.create).not.toHaveBeenCalled()
  })
})

// ------- resetPassword -------

describe('resetPassword', () => {
  const futureDate = new Date(Date.now() + 60_000)

  it('updates password and revokes all refresh tokens', async () => {
    vi.mocked(passwordResetTokenRepo.findByHash).mockResolvedValue({
      id: 'prt1', userId: 'user1', usedAt: null, expiresAt: futureDate,
    } as any)
    vi.mocked(passwordResetTokenRepo.markUsed).mockResolvedValue({} as any)
    vi.mocked(userRepo.updatePassword).mockResolvedValue(undefined as any)
    vi.mocked(refreshTokenRepo.revokeAllForUser).mockResolvedValue({} as any)

    await resetPassword('rawtoken', 'newpassword123')

    expect(passwordResetTokenRepo.markUsed).toHaveBeenCalledWith('prt1')
    expect(userRepo.updatePassword).toHaveBeenCalledWith('user1', expect.stringMatching(/^\$2/))
    expect(refreshTokenRepo.revokeAllForUser).toHaveBeenCalledWith('user1')
  })

  it('throws on invalid token', async () => {
    vi.mocked(passwordResetTokenRepo.findByHash).mockResolvedValue(null)
    await expect(resetPassword('bad', 'newpassword123')).rejects.toThrow('Invalid or expired reset token')
  })

  it('throws on already-used token', async () => {
    vi.mocked(passwordResetTokenRepo.findByHash).mockResolvedValue({
      id: 'prt1', userId: 'user1', usedAt: new Date(), expiresAt: futureDate,
    } as any)
    await expect(resetPassword('used', 'newpassword123')).rejects.toThrow('Invalid or expired reset token')
  })

  it('throws on expired token', async () => {
    vi.mocked(passwordResetTokenRepo.findByHash).mockResolvedValue({
      id: 'prt1', userId: 'user1', usedAt: null, expiresAt: new Date(Date.now() - 1000),
    } as any)
    await expect(resetPassword('expired', 'newpassword123')).rejects.toThrow('Invalid or expired reset token')
  })
})
