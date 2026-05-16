import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createInviteSchema,
  acceptInviteSchema,
  tagSchema,
  tagUpdateSchema,
} from '@/lib/schemas'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'secret' }).success).toBe(true)
  })
  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'secret' }).success).toBe(false)
  })
  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('accepts valid registration', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })
  it('rejects password shorter than 8 chars', () => {
    expect(registerSchema.safeParse({ name: 'John', email: 'john@example.com', password: 'short' }).success).toBe(false)
  })
  it('rejects missing name', () => {
    expect(registerSchema.safeParse({ email: 'john@example.com', password: 'password123' }).success).toBe(false)
  })
  it('defaults workspace to My Workspace', () => {
    const result = registerSchema.safeParse({ name: 'John', email: 'john@example.com', password: 'password123' })
    expect(result.success && result.data.workspace).toBe('My Workspace')
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true)
  })
  it('rejects non-email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('accepts valid token + password', () => {
    expect(resetPasswordSchema.safeParse({ token: 'abc123', password: 'newpassword' }).success).toBe(true)
  })
  it('rejects short password', () => {
    expect(resetPasswordSchema.safeParse({ token: 'abc123', password: 'short' }).success).toBe(false)
  })
  it('rejects empty token', () => {
    expect(resetPasswordSchema.safeParse({ token: '', password: 'newpassword' }).success).toBe(false)
  })
})

describe('createInviteSchema', () => {
  it('accepts valid invite', () => {
    expect(createInviteSchema.safeParse({ email: 'user@example.com', role: 'EMPLOYEE' }).success).toBe(true)
  })
  it('accepts all roles', () => {
    for (const role of ['ADMIN', 'MANAGER', 'EMPLOYEE']) {
      expect(createInviteSchema.safeParse({ email: 'u@e.com', role }).success).toBe(true)
    }
  })
  it('rejects invalid role', () => {
    expect(createInviteSchema.safeParse({ email: 'u@e.com', role: 'SUPERUSER' }).success).toBe(false)
  })
})

describe('acceptInviteSchema', () => {
  it('accepts valid payload', () => {
    expect(acceptInviteSchema.safeParse({ token: 'abc', name: 'John', password: 'pass1234' }).success).toBe(true)
  })
  it('rejects missing name', () => {
    expect(acceptInviteSchema.safeParse({ token: 'abc', password: 'pass1234' }).success).toBe(false)
  })
})

describe('tag schemas', () => {
  it('trims valid tag names and accepts default color', () => {
    const result = tagSchema.safeParse({ name: '  QA Review  ' })
    expect(result.success && result.data.name).toBe('QA Review')
    expect(result.success && result.data.color).toBe('#888888')
  })

  it('rejects blank and overlong tag names', () => {
    expect(tagSchema.safeParse({ name: '   ' }).success).toBe(false)
    expect(tagSchema.safeParse({ name: 'a'.repeat(51) }).success).toBe(false)
  })

  it('rejects invalid tag colors', () => {
    expect(tagSchema.safeParse({ name: 'QA', color: 'blue' }).success).toBe(false)
  })

  it('requires at least one update field', () => {
    expect(tagUpdateSchema.safeParse({}).success).toBe(false)
    expect(tagUpdateSchema.safeParse({ status: 'INACTIVE' }).success).toBe(true)
  })
})
