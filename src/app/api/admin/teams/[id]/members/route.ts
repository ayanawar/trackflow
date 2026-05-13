export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth'
import { teamMemberSchema } from '@/lib/schemas'
import { ok, noContent, badRequest, serverError } from '@/lib/response'
import { removeTeamMember, upsertTeamMember } from '@/services/team.service'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard
    const body = await req.json()
    const result = teamMemberSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    return ok(await upsertTeamMember(params.id, result.data))
  } catch (err) {
    console.error('[admin/team-members:POST]', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return badRequest('Missing userId')
    await removeTeamMember(params.id, userId)
    return noContent()
  } catch (err) {
    console.error('[admin/team-members:DELETE]', err)
    return serverError()
  }
}
