export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, unauthorized, notFound, serverError } from '@/lib/response'
import { stopEntry } from '@/services/timeEntry.service'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json().catch(() => ({})) as { endTime?: string }
    const endTime = body.endTime ? new Date(body.endTime) : undefined
    const entry = await stopEntry(params.id, session.userId, endTime)
    if (!entry) return notFound()
    return ok(entry)
  } catch (err) {
    console.error('[stop:PATCH]', err)
    return serverError()
  }
}
