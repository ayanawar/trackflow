export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, created, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/response'
import { addMemberToTeam } from '@/services/team.service'

type Params = { params: { orgId: string; teamId: string } }

const addMemberSchema = z.object({ userId: z.string().min(1) })

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json()
    const result = addMemberSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    const outcome = await addMemberToTeam(params.orgId, params.teamId, session.userId, result.data.userId)
    if ('error' in outcome) {
      if (outcome.error === 'Team not found') return notFound(outcome.error)
      if (outcome.error === 'User is not a member of this organization') return badRequest(outcome.error)
      return forbidden(outcome.error)
    }
    return created(outcome.member)
  } catch (err) {
    console.error('[team-members:POST]', err)
    return serverError()
  }
}
