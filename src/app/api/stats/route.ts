export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'
import { getStats } from '@/services/stats.service'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    return ok(await getStats(session.userId))
  } catch (err) {
    console.error('[stats:GET]', err)
    return serverError()
  }
}
