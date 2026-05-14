export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, badRequest, unauthorized, serverError } from '@/lib/response'
import { acceptInvitation } from '@/services/invitation.service'

type Params = { params: { token: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const result = await acceptInvitation(params.token, session.userId, session.email)
    if ('error' in result) return badRequest(result.error)
    return ok({ orgId: result.orgId })
  } catch (err) {
    console.error('[invitations/accept:POST]', err)
    return serverError()
  }
}
