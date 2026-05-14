export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { teamSchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, notFound, forbidden, serverError } from '@/lib/response'
import { listTeams, createTeam } from '@/services/team.service'

type Params = { params: { orgId: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const teams = await listTeams(params.orgId, session.userId)
    if (teams === null) return notFound('Organization not found')
    return ok(teams)
  } catch (err) {
    console.error('[teams:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json()
    const result = teamSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    const outcome = await createTeam(params.orgId, session.userId, result.data)
    if ('error' in outcome) return forbidden(outcome.error)
    return created(outcome.team)
  } catch (err) {
    console.error('[teams:POST]', err)
    return serverError()
  }
}
