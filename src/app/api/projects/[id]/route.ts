import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { projectSchema } from '@/lib/schemas'
import { ok, noContent, badRequest, unauthorized, notFound, serverError } from '@/lib/response'

async function getProject(id: string, userId: string) {
  const p = await prisma.project.findUnique({ where: { id } })
  if (!p) return null
  if (p.userId !== userId) return null
  return p
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session) return unauthorized()
  const p = await getProject(params.id, session.userId)
  if (!p) return notFound()
  return ok(p)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const p = await getProject(params.id, session.userId)
    if (!p) return notFound()

    const body = await req.json()
    const result = projectSchema.partial().safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    const updated = await prisma.project.update({ where: { id: params.id }, data: result.data })
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
    const p = await getProject(params.id, session.userId)
    if (!p) return notFound()

    await prisma.project.delete({ where: { id: params.id } })
    return noContent()
  } catch (err) {
    console.error('[project:DELETE]', err)
    return serverError()
  }
}
