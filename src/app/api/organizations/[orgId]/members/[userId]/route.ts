export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { memberRoleSchema } from '@/lib/schemas'
import { ok, badRequest, unauthorized, forbidden, notFound, noContent, serverError } from '@/lib/response'
import { updateMemberRole, removeMember } from '@/services/organization.service'

type Params = { params: { orgId: string; userId: string } }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json()
    const result = memberRoleSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    const outcome = await updateMemberRole(params.orgId, session.userId, params.userId, result.data.role)
    if ('error' in outcome) {
      if (outcome.error === 'Member not found') return notFound(outcome.error)
      return forbidden(outcome.error)
    }
    return ok(outcome.membership)
  } catch (err) {
    console.error('[members/[userId]:PUT]', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const outcome = await removeMember(params.orgId, session.userId, params.userId)
    if ('error' in outcome) {
      if (outcome.error === 'Member not found') return notFound(outcome.error)
      return forbidden(outcome.error)
    }
    return noContent()
  } catch (err) {
    console.error('[members/[userId]:DELETE]', err)
    return serverError()
  }
}
