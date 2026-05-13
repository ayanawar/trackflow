export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { projectSchema } from '@/lib/schemas'
import { ok, noContent, badRequest, unauthorized, notFound, serverError } from '@/lib/response'
import { getProject, updateProject, deleteProject } from '@/services/project.service'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const p = await getProject(params.id, session.userId)
    if (!p) return notFound()
    return ok(p)
  } catch (err) {
    console.error('[project:GET]', err)
    return serverError()
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json()
    const result = projectSchema.partial().safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    const updated = await updateProject(params.id, session.userId, result.data)
    if (!updated) return notFound()
    return ok(updated)
  } catch (err) {
    console.error('[project:PUT]', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const result = await deleteProject(params.id, session.userId)
    if (!result) return notFound()
    return noContent()
  } catch (err) {
    console.error('[project:DELETE]', err)
    return serverError()
  }
}
