export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest, requireRole } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'
import { getScopedStats } from '@/services/stats.service'
import type { Role } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireRole(['MANAGER', 'ADMIN'])(req)
    if (guard) return guard
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    return ok(await getScopedStats({ userId: session.userId, role: session.role as Role }))
  } catch (err) {
    console.error('[stats:GET]', err)
    return serverError()
  }
}
