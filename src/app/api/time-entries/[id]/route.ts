export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { timeEntryUpdateSchema } from '@/lib/schemas'
import { ok, noContent, badRequest, unauthorized, notFound, serverError } from '@/lib/response'
import { getEntry, updateEntry, deleteEntry } from '@/services/timeEntry.service'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const entry = await getEntry(params.id, session.userId)
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
    const body = await req.json()
    const result = timeEntryUpdateSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    const updated = await updateEntry(params.id, session.userId, result.data)
    if (!updated) return notFound()
    return ok(updated)
  } catch (err) {
    console.error('[time-entry:PUT]', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const result = await deleteEntry(params.id, session.userId)
    if (!result) return notFound()
    return noContent()
  } catch (err) {
    console.error('[time-entry:DELETE]', err)
    return serverError()
  }
}
