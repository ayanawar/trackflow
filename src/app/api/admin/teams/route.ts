export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest, requireRole } from '@/lib/auth'
import { teamSchema } from '@/lib/schemas'
import { ok, created, badRequest, serverError } from '@/lib/response'
import * as teamRepo from '@/repositories/team.repository'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard
    return ok(await teamRepo.findAll())
  } catch (err) {
    console.error('[admin/teams:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard
    const session = await getSessionFromRequest(req)
    const body = await req.json()
    const result = teamSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    const team = await teamRepo.create({ ...result.data, createdById: session!.userId })
    return created(team)
  } catch (err) {
    console.error('[admin/teams:POST]', err)
    return serverError()
  }
}
