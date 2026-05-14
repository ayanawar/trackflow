export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { unauthorized, forbidden, noContent, serverError } from '@/lib/response'
import { cancelInvitation } from '@/services/invitation.service'

type Params = { params: { orgId: string; inviteId: string } }

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const success = await cancelInvitation(params.orgId, params.inviteId, session.userId)
    if (!success) return forbidden()
    return noContent()
  } catch (err) {
    console.error('[invitations/[inviteId]:DELETE]', err)
    return serverError()
  }
}
