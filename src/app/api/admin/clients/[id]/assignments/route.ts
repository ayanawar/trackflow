export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth'
import { clientAssignmentSchema } from '@/lib/schemas'
import { ok, badRequest, serverError } from '@/lib/response'
import { assignClient } from '@/services/assignment.service'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard
    const body = await req.json()
    const result = clientAssignmentSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    return ok(await assignClient(params.id, result.data))
  } catch (err) {
    console.error('[admin/client-assignment:POST]', err)
    return serverError()
  }
}
