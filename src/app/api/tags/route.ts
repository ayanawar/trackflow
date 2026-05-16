export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { tagQuerySchema, tagSchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, forbidden, conflict, serverError } from '@/lib/response'
import { createTagForUser, listTagsForUser, TagConflictError, TagForbiddenError } from '@/services/tag.service'
import type { Role } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const { searchParams } = new URL(req.url)
    const result = tagQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
    if (!result.success) return badRequest(result.error.issues[0].message)
    try {
      return ok(await listTagsForUser(
        { userId: session.userId, role: session.role as Role },
        { status: result.data.status, query: result.data.q, includeUsage: result.data.includeUsage },
      ))
    } catch (err) {
      if (err instanceof TagForbiddenError) return forbidden()
      throw err
    }
  } catch (err) {
    console.error('[tags:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json()
    const result = tagSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    try {
      const { tag, created: wasCreated } = await createTagForUser(
        { userId: session.userId, role: session.role as Role },
        result.data,
      )
      return wasCreated ? created(tag) : ok(tag)
    } catch (err) {
      if (err instanceof TagConflictError) return conflict(err.message)
      throw err
    }
  } catch (err) {
    console.error('[tags:POST]', err)
    return serverError()
  }
}
