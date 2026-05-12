export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { noContent, unauthorized, notFound, serverError } from '@/lib/response'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const tag = await prisma.tag.findUnique({ where: { id: params.id } })
    if (!tag || tag.userId !== session.userId) return notFound()
    await prisma.tag.delete({ where: { id: params.id } })
    return noContent()
  } catch (err) {
    console.error('[tag:DELETE]', err)
    return serverError()
  }
}
