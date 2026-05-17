import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const WORKSPACE_ID = 'ws_test'

vi.mock('@/lib/auth', () => ({
  getSessionFromRequest: vi.fn(async () => ({
    userId: 'user_1',
    email: 'manager@test.com',
    name: 'Manager',
    role: 'MANAGER',
  })),
}))

vi.mock('@/lib/workspaceContext', () => ({
  resolveWorkspaceContext: vi.fn(async () => ({ workspaceId: WORKSPACE_ID, role: 'MEMBER' })),
  isWorkspaceContext: vi.fn((ctx: unknown) => !!(ctx as any)?.workspaceId),
}))

vi.mock('@/repositories/timeEntry.repository', () => ({
  findAllInDateRange: vi.fn(async () => [
    {
      id: 'entry_1',
      description: 'Test work',
      startTime: '2026-05-12T09:00:00.000Z',
      endTime: '2026-05-12T11:00:00.000Z',
      duration: 7200,
      isRunning: false,
      isPaused: false,
      pausedDuration: 0,
      billable: true,
      userId: 'user_1',
      workspaceId: WORKSPACE_ID,
      projectId: null,
      taskId: null,
      tagId: null,
    },
  ]),
}))

vi.mock('@/services/timeEntry.service', () => ({
  listAccessibleEntries: vi.fn(async () => []),
  createEntry: vi.fn(),
}))

import * as auth from '@/lib/auth'
import * as repo from '@/repositories/timeEntry.repository'
import { GET } from '@/app/api/time-entries/route'

function getReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/time-entries')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/time-entries — calendar date-range query', () => {
  it('returns entries for a valid week range', async () => {
    const res = await GET(getReq({ startDate: '2026-05-11', endDate: '2026-05-17' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(repo.findAllInDateRange).toHaveBeenCalledOnce()
  })

  it('returns 400 when startDate is provided without endDate', async () => {
    const res = await GET(getReq({ startDate: '2026-05-11' }))
    expect(res.status).toBe(400)
    expect(repo.findAllInDateRange).not.toHaveBeenCalled()
  })

  it('returns 400 when endDate is provided without startDate', async () => {
    const res = await GET(getReq({ endDate: '2026-05-17' }))
    expect(res.status).toBe(400)
    expect(repo.findAllInDateRange).not.toHaveBeenCalled()
  })

  it('returns 400 when date range exceeds 31 days', async () => {
    const res = await GET(getReq({ startDate: '2026-04-01', endDate: '2026-05-17' }))
    expect(res.status).toBe(400)
    expect(repo.findAllInDateRange).not.toHaveBeenCalled()
  })

  it('returns 400 when startDate format is invalid', async () => {
    const res = await GET(getReq({ startDate: '05-11-2026', endDate: '2026-05-17' }))
    expect(res.status).toBe(400)
  })

  it('MANAGER userId filter is honored and passed to repository', async () => {
    await GET(getReq({ startDate: '2026-05-11', endDate: '2026-05-17', userId: 'user_2' }))
    expect(repo.findAllInDateRange).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'MANAGER' }),
      WORKSPACE_ID,
      expect.any(Date),
      expect.any(Date),
      expect.objectContaining({ userId: 'user_2' }),
    )
  })

  it('EMPLOYEE cannot filter by another userId — returns 403', async () => {
    vi.mocked(auth.getSessionFromRequest).mockResolvedValueOnce({
      userId: 'user_1',
      email: 'emp@test.com',
      name: 'Emp',
      role: 'EMPLOYEE',
    } as any)
    const res = await GET(getReq({ startDate: '2026-05-11', endDate: '2026-05-17', userId: 'user_other' }))
    expect(res.status).toBe(403)
    expect(repo.findAllInDateRange).not.toHaveBeenCalled()
  })

  it('falls back to legacy behaviour when no date params provided', async () => {
    const res = await GET(getReq())
    expect(res.status).toBe(200)
    expect(repo.findAllInDateRange).not.toHaveBeenCalled()
  })
})
