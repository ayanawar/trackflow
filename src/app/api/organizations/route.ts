export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { orgSchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/response'
import { listUserOrgs, createOrg } from '@/services/organization.service'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    return ok(await listUserOrgs(session.userId))
  } catch (err) {
    console.error('[organizations:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json()
    const result = orgSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    const outcome = await createOrg(session.userId, result.data)
    if ('error' in outcome) return badRequest(outcome.error)
    return created(outcome.org)
  } catch (err) {
    console.error('[organizations:POST]', err)
    return serverError()
  }
}
