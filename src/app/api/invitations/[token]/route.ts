export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { ok, notFound, badRequest, serverError } from '@/lib/response'
import { getInvitationByToken } from '@/services/invitation.service'

type Params = { params: { token: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const result = await getInvitationByToken(params.token)
    if (!result) return notFound('Invitation not found')
    if ('error' in result) return badRequest(result.error)
    return ok(result.invitation)
  } catch (err) {
    console.error('[invitations/token:GET]', err)
    return serverError()
  }
}
