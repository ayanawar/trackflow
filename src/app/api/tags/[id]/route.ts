export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { noContent, unauthorized, notFound, serverError } from '@/lib/response'
import { findTagById, deleteTag } from '@/repositories/tag.repository'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const tag = await findTagById(params.id, session.userId)
    if (!tag) return notFound()
    await deleteTag(params.id, session.userId)
    return noContent()
  } catch (err) {
    console.error('[tag:DELETE]', err)
    return serverError()
  }
}
