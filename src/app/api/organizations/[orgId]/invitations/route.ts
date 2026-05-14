export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { inviteSchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, notFound, forbidden, serverError } from '@/lib/response'
import { listInvitations, createInvitation } from '@/services/invitation.service'

type Params = { params: { orgId: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const invitations = await listInvitations(params.orgId, session.userId)
    if (invitations === null) return forbidden()
    return ok(invitations)
  } catch (err) {
    console.error('[invitations:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json()
    const result = inviteSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    const outcome = await createInvitation(params.orgId, session.userId, result.data)
    if ('error' in outcome) return badRequest(outcome.error)
    return created(outcome.invitation)
  } catch (err) {
    console.error('[invitations:POST]', err)
    return serverError()
  }
}
