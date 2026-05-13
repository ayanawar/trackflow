export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { timeEntrySchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/response'
import { listEntries, createEntry } from '@/services/timeEntry.service'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') ?? '100')
    return ok(await listEntries(session.userId, limit))
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
    return created(await createEntry(session.userId, result.data))
  } catch (err) {
    console.error('[time-entries:POST]', err)
    return serverError()
  }
}
