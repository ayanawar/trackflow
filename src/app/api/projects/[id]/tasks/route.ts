export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { taskCreateSchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/response'
import { prisma } from '@/lib/prisma'
import { getAccessibleProject } from '@/services/project.service'
import type { Role } from '@/types'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const project = await getAccessibleProject(params.id, { userId: session.userId, role: session.role as Role })
    if (!project) return notFound('Project not found or access denied')

    const tasks = await prisma.task.findMany({
      where: { projectId: params.id },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })

    return ok(tasks)
  } catch (err) {
    console.error('[tasks:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    if (session.role === 'EMPLOYEE') return forbidden('Only Managers and Admins can create tasks')

    const project = await getAccessibleProject(params.id, { userId: session.userId, role: session.role as Role })
    if (!project) return notFound('Project not found or access denied')

    let body: unknown
    try { body = await req.json() } catch { return badRequest('Invalid JSON') }

    const result = taskCreateSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    const task = await prisma.task.create({
      data: {
        title: result.data.title,
        description: result.data.description ?? null,
        status: result.data.status,
        priority: result.data.priority,
        dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
        assigneeId: result.data.assigneeId ?? null,
        projectId: params.id,
        createdById: session.userId,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    return created(task)
  } catch (err) {
    console.error('[tasks:POST]', err)
    return serverError()
  }
}
