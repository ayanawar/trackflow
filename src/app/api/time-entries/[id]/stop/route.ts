export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { stopEntrySchema } from '@/lib/schemas'
import { ok, badRequest, unauthorized, notFound, serverError } from '@/lib/response'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const entry = await prisma.timeEntry.findUnique({ where: { id: params.id } })
    if (!entry || entry.userId !== session.userId) return notFound()

    const body = await req.json().catch(() => ({}))
    const endTime = body.endTime ? new Date(body.endTime) : new Date()
    const duration = Math.floor((endTime.getTime() - entry.startTime.getTime()) / 1000)

    const updated = await prisma.timeEntry.update({
      where: { id: params.id },
      data: { endTime, duration, isRunning: false },
      include: { project: true, tag: true },
    })

    return ok(updated)
  } catch (err) {
    console.error('[stop:PATCH]', err)
    return serverError()
  }
}
