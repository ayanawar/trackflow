import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/services/auth.service', () => ({
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
}))

vi.mock('@/services/securityEvent.service', () => ({
  recordSecurityEvent: vi.fn(),
  requestSecurityContext: vi.fn(() => ({ ipAddress: '127.0.0.1', userAgent: 'vitest' })),
}))

import * as authService from '@/services/auth.service'
import { POST as forgotPost } from '@/app/api/auth/forgot-password/route'
import { POST as resetPost } from '@/app/api/auth/reset-password/route'

function jsonReq(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

describe('password reset route handlers', () => {
  it('forgot password returns generic response', async () => {
    const res = await forgotPost(jsonReq('http://localhost/api/auth/forgot-password', {
      email: 'known@example.com',
    }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.message).toBe('If that email exists, reset instructions have been sent.')
    expect(authService.forgotPassword).toHaveBeenCalledWith('known@example.com')
  })

  it('reset password returns generic invalid token error', async () => {
    vi.mocked(authService.resetPassword).mockRejectedValue(new Error('Invalid or expired reset token'))
    const res = await resetPost(jsonReq('http://localhost/api/auth/reset-password', {
      token: 'bad-token',
      password: 'newpassword123',
    }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid or expired reset token' })
  })

  it('reset password succeeds for valid token', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue(undefined)
    const res = await resetPost(jsonReq('http://localhost/api/auth/reset-password', {
      token: 'good-token',
      password: 'newpassword123',
    }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'Password updated successfully' })
  })
})
