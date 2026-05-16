import { beforeEach, describe, expect, it, vi } from 'vitest'

const tagRepoMock = vi.hoisted(() => ({
  getWorkspaceKeyForUser: vi.fn(),
  findAllByWorkspace: vi.fn(),
  findByNormalizedName: vi.fn(),
  createTag: vi.fn(),
  findTagById: vi.fn(),
  findActiveTagById: vi.fn(),
  updateTag: vi.fn(),
  countTagUsage: vi.fn(),
  deleteTag: vi.fn(),
}))

vi.mock('@/repositories/tag.repository', () => tagRepoMock)

import {
  createTagForUser,
  deleteTagForUser,
  listTagsForUser,
  normalizeTagName,
  normalizedTagKey,
  TagConflictError,
  TagForbiddenError,
  updateTagForUser,
} from '@/services/tag.service'

beforeEach(() => {
  vi.clearAllMocks()
  tagRepoMock.getWorkspaceKeyForUser.mockResolvedValue('workspace:TrackFlow')
})

describe('tag service', () => {
  it('normalizes display names and duplicate keys', () => {
    expect(normalizeTagName('  QA   Review  ')).toBe('QA Review')
    expect(normalizedTagKey('  QA   Review  ')).toBe('qa review')
  })

  it('creates a workspace tag when no duplicate exists', async () => {
    tagRepoMock.findByNormalizedName.mockResolvedValue(null)
    tagRepoMock.createTag.mockResolvedValue({
      id: 'tag_1',
      name: 'QA Review',
      normalizedName: 'qa review',
      color: '#4f8ef7',
      status: 'ACTIVE',
      workspaceId: 'workspace:TrackFlow',
      userId: 'user_1',
      updatedById: 'user_1',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { timeEntries: 0 },
    })

    const result = await createTagForUser({ userId: 'user_1', role: 'EMPLOYEE' }, { name: ' QA   Review ', color: '#4f8ef7' })

    expect(result.created).toBe(true)
    expect(tagRepoMock.createTag).toHaveBeenCalledWith(expect.objectContaining({
      workspaceId: 'workspace:TrackFlow',
      normalizedName: 'qa review',
    }))
  })

  it('returns an existing active duplicate instead of creating another tag', async () => {
    tagRepoMock.findByNormalizedName.mockResolvedValue({
      id: 'tag_1',
      name: 'Meeting',
      normalizedName: 'meeting',
      color: '#888888',
      status: 'ACTIVE',
      workspaceId: 'workspace:TrackFlow',
      userId: 'user_1',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { timeEntries: 2 },
    })

    const result = await createTagForUser({ userId: 'user_2', role: 'EMPLOYEE' }, { name: ' meeting ' })

    expect(result.created).toBe(false)
    expect(tagRepoMock.createTag).not.toHaveBeenCalled()
    expect(result.tag.name).toBe('Meeting')
  })

  it('blocks inactive duplicate creation', async () => {
    tagRepoMock.findByNormalizedName.mockResolvedValue({ status: 'INACTIVE' })
    await expect(createTagForUser({ userId: 'user_1', role: 'EMPLOYEE' }, { name: 'Meeting' }))
      .rejects.toBeInstanceOf(TagConflictError)
  })

  it('blocks management metadata for employees', async () => {
    await expect(listTagsForUser({ userId: 'user_1', role: 'EMPLOYEE' }, { status: 'all', includeUsage: true }))
      .rejects.toBeInstanceOf(TagForbiddenError)
  })

  it('blocks duplicate rename in the same workspace', async () => {
    tagRepoMock.findTagById.mockResolvedValue({ id: 'tag_1' })
    tagRepoMock.findByNormalizedName.mockResolvedValue({ id: 'tag_2' })

    await expect(updateTagForUser({ userId: 'user_1', role: 'MANAGER' }, 'tag_1', { name: 'Meeting' }))
      .rejects.toBeInstanceOf(TagConflictError)
  })

  it('prevents deleting a tag used by time entries', async () => {
    tagRepoMock.findTagById.mockResolvedValue({ id: 'tag_1' })
    tagRepoMock.countTagUsage.mockResolvedValue(1)

    await expect(deleteTagForUser({ userId: 'user_1', role: 'ADMIN' }, 'tag_1'))
      .rejects.toBeInstanceOf(TagConflictError)
  })
})
