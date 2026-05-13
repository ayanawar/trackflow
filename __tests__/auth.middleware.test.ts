/**
 * Tests for requireRole middleware — uses real JWTs to avoid mocking internals.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'

import { requireRole, signToken } from '@/lib/auth'

type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE'

async function makeReqWithRole(role: Role): Promise<NextRequest> {
  const token = await signToken({ userId: 'u1', email: 'u@test.com', name: 'U', role })
  return new NextRequest('http://localhost/api/test', {
    headers: { cookie: `tf_token=${token}` },
  })
}

function makeReqNoAuth(): NextRequest {
  return new NextRequest('http://localhost/api/test')
}

describe('requireRole middleware', () => {
  it('returns null (allow) when session has required role', async () => {
    const req = await makeReqWithRole('ADMIN')
    expect(await requireRole(['ADMIN'])(req)).toBeNull()
  })

  it('returns 401 when no auth token', async () => {
    const result = await requireRole(['ADMIN'])(makeReqNoAuth())
    expect(result?.status).toBe(401)
  })

  it('returns 403 when role not in allowed list', async () => {
    const req = await makeReqWithRole('EMPLOYEE')
    const result = await requireRole(['ADMIN', 'MANAGER'])(req)
    expect(result?.status).toBe(403)
  })

  it('allows MANAGER when MANAGER is in the list', async () => {
    const req = await makeReqWithRole('MANAGER')
    expect(await requireRole(['MANAGER', 'ADMIN'])(req)).toBeNull()
  })

  it('denies EMPLOYEE from ADMIN-only route', async () => {
    const req = await makeReqWithRole('EMPLOYEE')
    expect((await requireRole(['ADMIN'])(req))?.status).toBe(403)
  })

  it('works with all roles in list', async () => {
    for (const role of ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[]) {
      const req = await makeReqWithRole(role)
      expect(await requireRole(['ADMIN', 'MANAGER', 'EMPLOYEE'])(req)).toBeNull()
    }
  })
})
