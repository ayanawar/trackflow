export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { timeEntryUpdateSchema } from '@/lib/schemas'
import { ok, noContent, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/response'
import { getAccessibleEntry, updateAccessibleEntry, deleteAccessibleEntry } from '@/services/timeEntry.service'
import { resolveWorkspaceContext, isWorkspaceContext } from '@/lib/workspaceContext'
import type { Role } from '@/types'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const ctx = await resolveWorkspaceContext(req, session)
    if (!isWorkspaceContext(ctx)) return ctx
    const entry = await getAccessibleEntry(params.id, { userId: session.userId, role: session.role as Role }, ctx.workspaceId)
    if (!entry) return notFound()
    return ok(entry)
  } catch (err) {
    console.error('[time-entry:GET]', err)
    return serverError()
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const ctx = await resolveWorkspaceContext(req, session)
    if (!isWorkspaceContext(ctx)) return ctx
    const body = await req.json()
    const result = timeEntryUpdateSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    try {
      const updated = await updateAccessibleEntry(params.id, { userId: session.userId, role: session.role as Role }, ctx.workspaceId, result.data)
      if (!updated) return notFound()
      return ok(updated)
    } catch (err) {
      if (err instanceof Error && err.message === 'Forbidden') return forbidden()
      throw err
    }
  } catch (err) {
    console.error('[time-entry:PUT]', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const ctx = await resolveWorkspaceContext(req, session)
    if (!isWorkspaceContext(ctx)) return ctx
    const result = await deleteAccessibleEntry(params.id, { userId: session.userId, role: session.role as Role }, ctx.workspaceId)
    if (!result) return notFound()
    return noContent()
  } catch (err) {
    console.error('[time-entry:DELETE]', err)
    return serverError()
  }
}
