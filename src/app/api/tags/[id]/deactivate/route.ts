export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, unauthorized, forbidden, notFound, serverError } from '@/lib/response'
import { deactivateTagForUser, TagForbiddenError, TagNotFoundError } from '@/services/tag.service'
import type { Role } from '@/types'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    try {
      return ok(await deactivateTagForUser({ userId: session.userId, role: session.role as Role }, params.id))
    } catch (err) {
      if (err instanceof TagForbiddenError) return forbidden()
      if (err instanceof TagNotFoundError) return notFound()
      throw err
    }
  } catch (err) {
    console.error('[tag:DEACTIVATE]', err)
    return serverError()
  }
}
