export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth'
import { teamSchema } from '@/lib/schemas'
import { ok, badRequest, noContent, serverError } from '@/lib/response'
import * as teamRepo from '@/repositories/team.repository'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard
    const body = await req.json()
    const result = teamSchema.partial().safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    return ok(await teamRepo.update(params.id, result.data))
  } catch (err) {
    console.error('[admin/teams:PATCH]', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard
    await teamRepo.deleteById(params.id)
    return noContent()
  } catch (err) {
    console.error('[admin/teams:DELETE]', err)
    return serverError()
  }
}
