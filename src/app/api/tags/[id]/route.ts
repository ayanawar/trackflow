export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { tagUpdateSchema } from '@/lib/schemas'
import { ok, noContent, badRequest, unauthorized, forbidden, notFound, conflict, serverError } from '@/lib/response'
import {
  deleteTagForUser,
  TagConflictError,
  TagForbiddenError,
  TagNotFoundError,
  updateTagForUser,
} from '@/services/tag.service'
import type { Role } from '@/types'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json()
    const result = tagUpdateSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    try {
      return ok(await updateTagForUser(
        { userId: session.userId, role: session.role as Role },
        params.id,
        result.data,
      ))
    } catch (err) {
      if (err instanceof TagForbiddenError) return forbidden()
      if (err instanceof TagNotFoundError) return notFound()
      if (err instanceof TagConflictError) return conflict(err.message)
      throw err
    }
  } catch (err) {
    console.error('[tag:PATCH]', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    try {
      await deleteTagForUser({ userId: session.userId, role: session.role as Role }, params.id)
      return noContent()
    } catch (err) {
      if (err instanceof TagForbiddenError) return forbidden()
      if (err instanceof TagNotFoundError) return notFound()
      if (err instanceof TagConflictError) return conflict(err.message)
      throw err
    }
  } catch (err) {
    console.error('[tag:DELETE]', err)
    return serverError()
  }
}
