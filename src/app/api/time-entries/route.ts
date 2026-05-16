export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { timeEntrySchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, forbidden, serverError } from '@/lib/response'
import { listAccessibleEntries, createEntry } from '@/services/timeEntry.service'
import type { Role } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') ?? '100')
    const tagId = searchParams.get('tagId')
    return ok(await listAccessibleEntries(
      { userId: session.userId, role: session.role as Role },
      limit,
      { tagId },
    ))
  } catch (err) {
    console.error('[time-entries:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json()
    const result = timeEntrySchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    try {
      return created(await createEntry(session.userId, result.data, session.role as Role))
    } catch (err) {
      if (err instanceof Error && err.message === 'Forbidden') return forbidden()
      throw err
    }
  } catch (err) {
    console.error('[time-entries:POST]', err)
    return serverError()
  }
}
