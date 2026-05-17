import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { forbidden, notFound, unauthorized } from '@/lib/response'
import * as workspaceRepo from '@/repositories/workspace.repository'
import * as userRepo from '@/repositories/user.repository'
import type { JWTPayload } from '@/lib/auth'

export const WORKSPACE_HEADER = 'x-workspace-id'

export interface WorkspaceContext {
  workspaceId: string
  role: 'ADMIN' | 'MEMBER'
}

/**
 * Resolve the active workspace for the given request + session.
 *
 *  1. If the request carries an `X-Workspace-Id` header, validate the caller
 *     is a member of that workspace (direct membership OR org owner/admin
 *     implicit access). If valid, use it; if not, fall through.
 *  2. Otherwise, use User.activeWorkspaceId and validate membership.
 *  3. If the stored active workspace is stale (user removed), repair by
 *     setting activeWorkspaceId to ANY workspace they still have access to.
 *  4. If the user has zero accessible workspaces, return 403.
 *
 * Returns a `NextResponse` on failure (caller MUST early-return it).
 */
export async function resolveWorkspaceContext(
  req: NextRequest,
  session: JWTPayload | null,
): Promise<WorkspaceContext | NextResponse> {
  if (!session) return unauthorized()

  const headerId = req.headers.get(WORKSPACE_HEADER)
  if (headerId) {
    const role = await workspaceRepo.isMember(headerId, session.userId)
    if (role) return { workspaceId: headerId, role }
    return forbidden('No access to this workspace')
  }

  const user = await userRepo.findById(session.userId)
  if (!user) return unauthorized()

  if (user.activeWorkspaceId) {
    const role = await workspaceRepo.isMember(user.activeWorkspaceId, session.userId)
    if (role) return { workspaceId: user.activeWorkspaceId, role }
  }

  // Stale or missing — try to repair by picking any accessible workspace.
  const accessible = await workspaceRepo.listForUser(session.userId)
  if (accessible.length === 0) {
    return forbidden('No workspace access')
  }
  const first = accessible[0]
  await userRepo.setActiveWorkspace(session.userId, first.id)
  return { workspaceId: first.id, role: first.role }
}

/**
 * Convenience that throws-via-return when a non-WorkspaceContext value is
 * returned by resolveWorkspaceContext, so callers can write
 *
 *     const ctx = await mustResolveWorkspaceContext(req, session)
 *     if (ctx instanceof NextResponse) return ctx
 *     ...use ctx.workspaceId
 */
export function isWorkspaceContext(
  v: WorkspaceContext | NextResponse,
): v is WorkspaceContext {
  return !(v instanceof NextResponse)
}

/**
 * Render a 404 deliberately when a workspace-scoped resource is not found OR
 * not visible. Prevents leaking existence via 403.
 */
export function workspaceScopedNotFound() {
  return notFound()
}
