import type { Tag, TagStatus } from '@prisma/client'
import * as tagRepo from '@/repositories/tag.repository'
import type { Role } from '@/types'

export class TagConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TagConflictError'
  }
}

export class TagForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message)
    this.name = 'TagForbiddenError'
  }
}

export class TagNotFoundError extends Error {
  constructor(message = 'Tag not found') {
    super(message)
    this.name = 'TagNotFoundError'
  }
}

export function canManageTags(role: Role) {
  return role === 'ADMIN' || role === 'MANAGER'
}

export function normalizeTagName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

export function normalizedTagKey(name: string) {
  return normalizeTagName(name).toLocaleLowerCase()
}

function toTagResponse(tag: any, canManage: boolean) {
  const usageCount = tag._count?.timeEntries ?? tag.usageCount ?? undefined
  return {
    id: tag.id,
    name: tag.name,
    normalizedName: tag.normalizedName,
    color: tag.color,
    status: tag.status,
    workspaceId: tag.workspaceId,
    userId: tag.userId,
    createdById: tag.userId,
    updatedById: tag.updatedById ?? null,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
    ...(usageCount !== undefined && {
      usageCount,
      canDelete: canManage && usageCount === 0,
    }),
  }
}

export async function listTagsForUser(
  user: { userId: string; role: Role },
  options: { status?: 'active' | 'inactive' | 'all'; query?: string; includeUsage?: boolean } = {}
) {
  const workspaceId = await tagRepo.getWorkspaceKeyForUser(user.userId)
  if (!workspaceId) throw new TagNotFoundError('Workspace not found')

  const canManage = canManageTags(user.role)
  if ((options.includeUsage || options.status === 'all' || options.status === 'inactive') && !canManage) {
    throw new TagForbiddenError()
  }

  const status =
    options.status === 'all'
      ? 'ALL'
      : options.status === 'inactive'
        ? 'INACTIVE'
        : 'ACTIVE'

  const tags = await tagRepo.findAllByWorkspace(workspaceId, {
    status,
    query: options.query,
    includeUsage: Boolean(options.includeUsage || canManage),
  })

  return tags.map(tag => toTagResponse(tag, canManage))
}

export async function createTagForUser(
  user: { userId: string; role: Role },
  data: { name: string; color?: string }
) {
  const workspaceId = await tagRepo.getWorkspaceKeyForUser(user.userId)
  if (!workspaceId) throw new TagNotFoundError('Workspace not found')

  const name = normalizeTagName(data.name)
  const normalizedName = normalizedTagKey(name)
  const existing = await tagRepo.findByNormalizedName(workspaceId, normalizedName)
  if (existing) {
    if (existing.status === 'INACTIVE') {
      throw new TagConflictError('A matching inactive tag already exists. Ask a manager or admin to reactivate it.')
    }
    return { tag: toTagResponse(existing, canManageTags(user.role)), created: false }
  }

  const tag = await tagRepo.createTag({
    name,
    normalizedName,
    color: data.color ?? '#888888',
    workspaceId,
    userId: user.userId,
  })

  return { tag: toTagResponse(tag, canManageTags(user.role)), created: true }
}

export async function getOrCreateActiveTagForUser(userId: string, name: string) {
  const result = await createTagForUser({ userId, role: 'EMPLOYEE' }, { name })
  return result.tag as Tag
}

export async function resolveActiveTagForUser(userId: string, input: { tagId?: string | null; tag?: string | null }) {
  const workspaceId = await tagRepo.getWorkspaceKeyForUser(userId)
  if (!workspaceId) throw new TagNotFoundError('Workspace not found')

  if (input.tagId) {
    const tag = await tagRepo.findActiveTagById(input.tagId, workspaceId)
    if (!tag) throw new TagNotFoundError('Tag not found')
    return tag
  }

  if (input.tag) {
    return getOrCreateActiveTagForUser(userId, input.tag)
  }

  return null
}

export async function updateTagForUser(
  user: { userId: string; role: Role },
  id: string,
  data: { name?: string; color?: string; status?: TagStatus }
) {
  if (!canManageTags(user.role)) throw new TagForbiddenError()
  const workspaceId = await tagRepo.getWorkspaceKeyForUser(user.userId)
  if (!workspaceId) throw new TagNotFoundError('Workspace not found')

  const existing = await tagRepo.findTagById(id, workspaceId)
  if (!existing) throw new TagNotFoundError()

  let name: string | undefined
  let normalizedName: string | undefined
  if (data.name !== undefined) {
    name = normalizeTagName(data.name)
    normalizedName = normalizedTagKey(name)
    const duplicate = await tagRepo.findByNormalizedName(workspaceId, normalizedName)
    if (duplicate && duplicate.id !== id) {
      throw new TagConflictError('A tag with this name already exists.')
    }
  }

  const tag = await tagRepo.updateTag(id, workspaceId, {
    ...(name !== undefined && { name, normalizedName }),
    ...(data.color !== undefined && { color: data.color }),
    ...(data.status !== undefined && { status: data.status }),
    updatedById: user.userId,
  })
  return toTagResponse(tag, true)
}

export async function deactivateTagForUser(user: { userId: string; role: Role }, id: string) {
  return updateTagForUser(user, id, { status: 'INACTIVE' })
}

export async function deleteTagForUser(user: { userId: string; role: Role }, id: string) {
  if (!canManageTags(user.role)) throw new TagForbiddenError()
  const workspaceId = await tagRepo.getWorkspaceKeyForUser(user.userId)
  if (!workspaceId) throw new TagNotFoundError('Workspace not found')
  const tag = await tagRepo.findTagById(id, workspaceId)
  if (!tag) throw new TagNotFoundError()

  const usageCount = await tagRepo.countTagUsage(id)
  if (usageCount > 0) {
    throw new TagConflictError('This tag is used by time entries. Deactivate it instead.')
  }

  await tagRepo.deleteTag(id, workspaceId)
  return true
}
