export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { unauthorized, forbidden, noContent, serverError } from '@/lib/response'
import { removeMemberFromTeam } from '@/services/team.service'

type Params = { params: { orgId: string; teamId: string; userId: string } }

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const success = await removeMemberFromTeam(params.orgId, params.teamId, session.userId, params.userId)
    if (!success) return forbidden()
    return noContent()
  } catch (err) {
    console.error('[team-members/[userId]:DELETE]', err)
    return serverError()
  }
}
