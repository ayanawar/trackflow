import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/repositories/securityEvent.repository', () => ({
  create: vi.fn(),
}))

import * as securityEventRepo from '@/repositories/securityEvent.repository'
import { recordSecurityEvent, requestSecurityContext } from '@/services/securityEvent.service'

beforeEach(() => vi.clearAllMocks())

describe('security events', () => {
  it('records safe event metadata without secrets', async () => {
    await recordSecurityEvent({
      type: 'LOGIN_FAILED',
      email: 'user@example.com',
      metadata: {
        password: 'secret',
        token: 'raw-token',
        reason: 'bad-password',
      },
    })

    expect(securityEventRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      type: 'LOGIN_FAILED',
      metadata: { reason: 'bad-password' },
    }))
  })

  it('extracts request security context', () => {
    const req = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '203.0.113.1, 10.0.0.1',
        'user-agent': 'vitest',
      },
    })

    expect(requestSecurityContext(req)).toEqual({
      ipAddress: '203.0.113.1',
      userAgent: 'vitest',
    })
  })
})
