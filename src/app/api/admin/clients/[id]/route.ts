export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth'
import { clientSchema } from '@/lib/schemas'
import { ok, badRequest, serverError } from '@/lib/response'
import { updateClient } from '@/services/client.service'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard
    const body = await req.json()
    const result = clientSchema.partial().safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    return ok(await updateClient(params.id, result.data))
  } catch (err) {
    console.error('[admin/clients:PATCH]', err)
    return serverError()
  }
}
