export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireRole, getSessionFromRequest } from '@/lib/auth'
import { ok, badRequest, unauthorized, serverError } from '@/lib/response'
import { createInviteSchema } from '@/lib/schemas'
import { createInvite } from '@/services/auth.service'
import { getAppBaseUrl } from '@/lib/appUrl'

export async function POST(req: NextRequest) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard

    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const body = await req.json()
    const result = createInviteSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    let invite: Awaited<ReturnType<typeof createInvite>>
    try {
      invite = await createInvite(
        session.userId,
        result.data.email,
        result.data.role,
        result.data.workspaceId,
        getAppBaseUrl(req),
      )
    } catch (err) {
      return badRequest(err instanceof Error ? err.message : 'Could not create invite')
    }

    return ok(invite)
  } catch (err) {
    console.error('[admin/invites:POST]', err)
    return serverError()
  }
}
