import prisma from '@/lib/prisma'
import * as workspaceRepo from '@/repositories/workspace.repository'
import * as workspaceMembershipRepo from '@/repositories/workspaceMembership.repository'
import * as userRepo from '@/repositories/user.repository'
import {
  canAccessWorkspace,
  canDeleteWorkspace,
} from '@/services/authorization.service'

export interface CreateWorkspaceInput {
  actorUserId: string
  orgId: string
  name: string
}

export class WorkspaceServiceError extends Error {
  code: 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'BAD_REQUEST' | 'WOULD_ORPHAN'
  meta?: Record<string, unknown>
  constructor(code: WorkspaceServiceError['code'], message: string, meta?: Record<string, unknown>) {
    super(message)
    this.code = code
    this.meta = meta
  }
}

export async function listForUser(userId: string) {
  const items = await workspaceRepo.listForUser(userId)
  const user = await userRepo.findById(userId)
  const activeId = user?.activeWorkspaceId ?? null
  return items.map(w => ({ ...w, isActive: w.id === activeId }))
}

/** Any org member may create a new workspace (Clockify-style, FR-006). */
export async function createWorkspace({ actorUserId, orgId, name }: CreateWorkspaceInput) {
  // Caller must be a member of the target org (any role)
  const m = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: actorUserId, orgId } },
  })
  if (!m) throw new WorkspaceServiceError('FORBIDDEN', 'Not a member of this organization')

  const trimmed = name.trim()
  const normalizedName = trimmed.toLowerCase()
  const existing = await workspaceRepo.findByOrgAndNormalizedName(orgId, normalizedName)
  if (existing) {
    throw new WorkspaceServiceError('CONFLICT', 'name: already exists in this organization')
  }

  const ws = await prisma.$transaction(async tx => {
    const created = await tx.workspace.create({
      data: { orgId, name: trimmed, normalizedName, createdById: actorUserId },
    })
    await tx.workspaceMembership.create({
      data: { workspaceId: created.id, userId: actorUserId, role: 'ADMIN' },
    })
    return created
  })
  return ws
}

export async function switchActive(userId: string, workspaceId: string) {
  const allowed = await canAccessWorkspace(userId, workspaceId)
  if (!allowed) throw new WorkspaceServiceError('FORBIDDEN', 'Not a member of this workspace')
  await userRepo.setActiveWorkspace(userId, workspaceId)
  return { activeWorkspaceId: workspaceId }
}

export async function deleteWorkspace({
  actorUserId,
  workspaceId,
  confirmName,
}: {
  actorUserId: string
  workspaceId: string
  confirmName: string
}) {
  const ws = await workspaceRepo.findById(workspaceId)
  if (!ws) throw new WorkspaceServiceError('NOT_FOUND', 'Workspace not found')

  // Permission check first so we don't leak existence to unauthorized callers.
  const allowed = await canDeleteWorkspace(actorUserId, workspaceId)
  if (!allowed) throw new WorkspaceServiceError('NOT_FOUND', 'Workspace not found')

  if (confirmName !== ws.name) {
    throw new WorkspaceServiceError('BAD_REQUEST', 'confirmName: must match workspace name exactly')
  }

  // Pre-check: would deletion leave any member with zero accessible workspaces?
  // For each member, count their WorkspaceMembership rows EXCLUDING this workspace.
  const members = await workspaceMembershipRepo.listByWorkspace(workspaceId)
  const blocked: { userId: string; email: string }[] = []
  for (const m of members) {
    const remaining = await prisma.workspaceMembership.count({
      where: { userId: m.userId, workspaceId: { not: workspaceId } },
    })
    if (remaining === 0) {
      blocked.push({ userId: m.userId, email: m.user.email })
    }
  }
  if (blocked.length > 0) {
    throw new WorkspaceServiceError(
      'WOULD_ORPHAN',
      'Deletion blocked — these users have no other workspace.',
      { blockedUsers: blocked },
    )
  }

  // Repoint anyone who has this workspace active before deletion. Some deployed
  // schemas keep activeWorkspaceId non-null, so relying on FK SET NULL can fail.
  const stale = await prisma.user.findMany({
    where: { activeWorkspaceId: workspaceId },
    select: { id: true },
  })
  for (const u of stale) {
    const accessible = await workspaceRepo.listForUser(u.id)
    const replacement = accessible.find(item => item.id !== workspaceId)
    if (replacement) {
      await userRepo.setActiveWorkspace(u.id, replacement.id)
    }
  }

  await workspaceRepo.deleteCascade(workspaceId)
}
