import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({
  getSessionFromRequest: vi.fn(async () => ({
    userId: 'user_1',
    email: 'user@test.com',
    name: 'User',
    role: 'ADMIN',
  })),
}))

vi.mock('@/services/tag.service', async () => {
  class TagConflictError extends Error {}
  class TagForbiddenError extends Error {}
  class TagNotFoundError extends Error {}
  return {
    TagConflictError,
    TagForbiddenError,
    TagNotFoundError,
    createTagForUser: vi.fn(),
    listTagsForUser: vi.fn(),
    updateTagForUser: vi.fn(),
    deleteTagForUser: vi.fn(),
    deactivateTagForUser: vi.fn(),
  }
})

import * as auth from '@/lib/auth'
import * as tagService from '@/services/tag.service'
import { GET, POST } from '@/app/api/tags/route'
import { DELETE, PATCH } from '@/app/api/tags/[id]/route'
import { POST as deactivatePost } from '@/app/api/tags/[id]/deactivate/route'

function jsonReq(url: string, body: unknown, method = 'POST') {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

describe('tag route handlers', () => {
  it('lists workspace tags for an authenticated user', async () => {
    vi.mocked(tagService.listTagsForUser).mockResolvedValue([{ id: 'tag_1', name: 'QA' }] as any)
    const res = await GET(new NextRequest('http://localhost/api/tags?status=active'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 'tag_1', name: 'QA' }])
  })

  it('returns 403 when management metadata is forbidden', async () => {
    vi.mocked(tagService.listTagsForUser).mockRejectedValue(new tagService.TagForbiddenError())
    const res = await GET(new NextRequest('http://localhost/api/tags?status=all&includeUsage=true'))
    expect(res.status).toBe(403)
  })

  it('allows employee tag creation from tracker', async () => {
    vi.mocked(auth.getSessionFromRequest).mockResolvedValueOnce({
      userId: 'employee_1',
      email: 'employee@test.com',
      name: 'Employee',
      role: 'EMPLOYEE',
    } as any)
    vi.mocked(tagService.createTagForUser).mockResolvedValue({ created: true, tag: { id: 'tag_1', name: 'QA' } } as any)

    const res = await POST(jsonReq('http://localhost/api/tags', { name: 'QA' }))

    expect(res.status).toBe(201)
    expect(tagService.createTagForUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'EMPLOYEE' }), expect.objectContaining({ name: 'QA' }))
  })

  it('returns 200 for active duplicate tag creation', async () => {
    vi.mocked(tagService.createTagForUser).mockResolvedValue({ created: false, tag: { id: 'tag_1', name: 'QA' } } as any)
    const res = await POST(jsonReq('http://localhost/api/tags', { name: 'qa' }))
    expect(res.status).toBe(200)
  })

  it('maps inactive duplicate tag creation to 409', async () => {
    vi.mocked(tagService.createTagForUser).mockRejectedValue(new tagService.TagConflictError('inactive duplicate'))
    const res = await POST(jsonReq('http://localhost/api/tags', { name: 'QA' }))
    expect(res.status).toBe(409)
  })

  it('updates tags through manager/admin route', async () => {
    vi.mocked(tagService.updateTagForUser).mockResolvedValue({ id: 'tag_1', name: 'Review' } as any)
    const res = await PATCH(jsonReq('http://localhost/api/tags/tag_1', { name: 'Review' }, 'PATCH'), { params: { id: 'tag_1' } })
    expect(res.status).toBe(200)
  })

  it('deactivates tags through lifecycle route', async () => {
    vi.mocked(tagService.deactivateTagForUser).mockResolvedValue({ id: 'tag_1', status: 'INACTIVE' } as any)
    const res = await deactivatePost(new NextRequest('http://localhost/api/tags/tag_1/deactivate', { method: 'POST' }), { params: { id: 'tag_1' } })
    expect(res.status).toBe(200)
  })

  it('maps used tag delete conflict to 409', async () => {
    vi.mocked(tagService.deleteTagForUser).mockRejectedValue(new tagService.TagConflictError('used'))
    const res = await DELETE(new NextRequest('http://localhost/api/tags/tag_1', { method: 'DELETE' }), { params: { id: 'tag_1' } })
    expect(res.status).toBe(409)
  })
})
