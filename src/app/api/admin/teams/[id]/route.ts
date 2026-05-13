export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth'
import { teamSchema } from '@/lib/schemas'
import { ok, badRequest, serverError } from '@/lib/response'
import { updateTeam } from '@/services/team.service'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard
    const body = await req.json()
    const result = teamSchema.partial().safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    return ok(await updateTeam(params.id, result.data))
  } catch (err) {
    console.error('[admin/teams:PATCH]', err)
    return serverError()
  }
}
