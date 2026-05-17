export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth'
import { projectAssignmentSchema } from '@/lib/schemas'
import { ok, noContent, badRequest, serverError } from '@/lib/response'
import { prisma } from '@/lib/prisma'
import { assignProject } from '@/services/assignment.service'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN', 'MANAGER'])(req)
    if (guard) return guard
    const userId = new URL(req.url).searchParams.get('userId')
    if (!userId) return badRequest('userId required')
    await prisma.projectAssignment.deleteMany({ where: { projectId: params.id, userId } })
    return noContent()
  } catch (err) {
    console.error('[admin/project-assignment:DELETE]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await requireRole(['ADMIN'])(req)
    if (guard) return guard
    const body = await req.json()
    const result = projectAssignmentSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    return ok(await assignProject(params.id, result.data))
  } catch (err) {
    console.error('[admin/project-assignment:POST]', err)
    return serverError()
  }
}
