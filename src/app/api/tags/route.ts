export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { tagSchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/response'
import { findAllByUser, upsertByName } from '@/repositories/tag.repository'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    return ok(await findAllByUser(session.userId))
  } catch (err) {
    console.error('[tags:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json()
    const result = tagSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    const tag = await upsertByName(result.data.name, session.userId)
    return created(tag)
  } catch (err) {
    console.error('[tags:POST]', err)
    return serverError()
  }
}
