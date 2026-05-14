import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<any>('@/lib/auth')
  return {
    ...actual,
    signToken: vi.fn(async () => 'access-token'),
    setTokenCookie: vi.fn(),
    setRefreshCookie: vi.fn(),
    getRefreshFromRequest: vi.fn(() => 'refresh-token'),
    clearTokenCookie: vi.fn(),
    clearRefreshCookie: vi.fn(),
    getSessionFromRequest: vi.fn(async () => ({
      userId: 'user_1',
      email: 'user@test.com',
      name: 'User',
      role: 'ADMIN',
    })),
  }
})

vi.mock('@/services/auth.service', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  getMe: vi.fn(),
}))

vi.mock('@/services/securityEvent.service', () => ({
  recordSecurityEvent: vi.fn(),
  requestSecurityContext: vi.fn(() => ({ ipAddress: '127.0.0.1', userAgent: 'vitest' })),
}))

import * as authService from '@/services/auth.service'
import * as authLib from '@/lib/auth'
import { POST as loginPost } from '@/app/api/auth/login/route'
import { POST as logoutPost } from '@/app/api/auth/logout/route'
import { POST as refreshPost } from '@/app/api/auth/refresh/route'
import { GET as meGet } from '@/app/api/auth/me/route'

function jsonReq(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const user = {
  id: 'user_1',
  name: 'User',
  email: 'user@test.com',
  workspace: 'Workspace',
  role: 'ADMIN',
  dailyHoursGoal: 8,
}

beforeEach(() => vi.clearAllMocks())

describe('auth route handlers', () => {
  it('login sets cookies and does not expose refresh token', async () => {
    vi.mocked(authService.login).mockResolvedValue({ user, rawRefreshToken: 'refresh-raw' } as any)

    const res = await loginPost(jsonReq('http://localhost/api/auth/login', {
      email: 'user@test.com',
      password: 'password123',
    }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(authLib.setTokenCookie).toHaveBeenCalledWith('access-token')
    expect(authLib.setRefreshCookie).toHaveBeenCalledWith('refresh-raw')
    expect(body.rawRefreshToken).toBeUndefined()
  })

  it('logout revokes refresh token and clears cookies', async () => {
    const res = await logoutPost(new NextRequest('http://localhost/api/auth/logout', { method: 'POST' }))
    expect(res.status).toBe(200)
    expect(authService.logout).toHaveBeenCalledWith('refresh-token')
    expect(authLib.clearTokenCookie).toHaveBeenCalled()
    expect(authLib.clearRefreshCookie).toHaveBeenCalled()
  })

  it('refresh rotates cookies', async () => {
    vi.mocked(authService.refresh).mockResolvedValue({ user, rawRefreshToken: 'new-refresh' } as any)
    const res = await refreshPost(new NextRequest('http://localhost/api/auth/refresh', { method: 'POST' }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.message).toBe('Session refreshed')
    expect(authLib.setRefreshCookie).toHaveBeenCalledWith('new-refresh')
  })

  it('me returns the current safe user', async () => {
    vi.mocked(authService.getMe).mockResolvedValue(user as any)
    const res = await meGet(new NextRequest('http://localhost/api/auth/me'))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ id: 'user_1', role: 'ADMIN' })
  })
})
