export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { taskUpdateSchema } from '@/lib/schemas'
import { ok, noContent, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/response'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const task = await prisma.task.findUnique({ where: { id: params.id } })
    if (!task) return notFound()

    let body: unknown
    try { body = await req.json() } catch { return badRequest('Invalid JSON') }

    const result = taskUpdateSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(result.data.title !== undefined && { title: result.data.title }),
        ...(result.data.description !== undefined && { description: result.data.description }),
        ...(result.data.status !== undefined && { status: result.data.status }),
        ...(result.data.priority !== undefined && { priority: result.data.priority }),
        ...(result.data.dueDate !== undefined && { dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null }),
        ...(result.data.assigneeId !== undefined && { assigneeId: result.data.assigneeId }),
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    return ok(updated)
  } catch (err) {
    console.error('[task:PATCH]', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    if (session.role === 'EMPLOYEE') return forbidden('Only Managers and Admins can delete tasks')

    const task = await prisma.task.findUnique({ where: { id: params.id } })
    if (!task) return notFound()

    await prisma.task.delete({ where: { id: params.id } })
    return noContent()
  } catch (err) {
    console.error('[task:DELETE]', err)
    return serverError()
  }
}
