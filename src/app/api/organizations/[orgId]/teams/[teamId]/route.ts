export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { teamSchema } from '@/lib/schemas'
import { ok, badRequest, unauthorized, forbidden, notFound, noContent, serverError } from '@/lib/response'
import { getTeam, updateTeam, deleteTeam } from '@/services/team.service'

type Params = { params: { orgId: string; teamId: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const team = await getTeam(params.orgId, params.teamId, session.userId)
    if (!team) return notFound('Team not found')
    return ok(team)
  } catch (err) {
    console.error('[teams/[teamId]:GET]', err)
    return serverError()
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json()
    const result = teamSchema.partial().safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    const team = await updateTeam(params.orgId, params.teamId, session.userId, result.data)
    if (!team) return forbidden()
    return ok(team)
  } catch (err) {
    console.error('[teams/[teamId]:PUT]', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const success = await deleteTeam(params.orgId, params.teamId, session.userId)
    if (!success) return forbidden()
    return noContent()
  } catch (err) {
    console.error('[teams/[teamId]:DELETE]', err)
    return serverError()
  }
}
