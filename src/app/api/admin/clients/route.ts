export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest, requireRole } from '@/lib/auth'
import { clientSchema } from '@/lib/schemas'
import { ok, created, badRequest, serverError } from '@/lib/response'
import { createClient, listClients } from '@/services/client.service'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard
    return ok(await listClients())
  } catch (err) {
    console.error('[admin/clients:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard
    const session = await getSessionFromRequest(req)
    const body = await req.json()
    const result = clientSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    return created(await createClient(session!.userId, result.data))
  } catch (err) {
    console.error('[admin/clients:POST]', err)
    return serverError()
  }
}
