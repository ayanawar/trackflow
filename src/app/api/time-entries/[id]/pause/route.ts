export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, unauthorized, notFound, serverError } from '@/lib/response'
import { pauseEntry } from '@/services/timeEntry.service'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const entry = await pauseEntry(params.id, session.userId)
    if (!entry) return notFound()
    return ok(entry)
  } catch (err) {
    console.error('[pause:PATCH]', err)
    return serverError()
  }
}
