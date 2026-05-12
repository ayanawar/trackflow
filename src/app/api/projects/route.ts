import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { projectSchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/response'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const projects = await prisma.project.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { timeEntries: true } },
        timeEntries: { select: { duration: true }, where: { duration: { not: null } } },
      },
    })

    const data = projects.map((p) => ({
      id: p.id,
      name: p.name,
      client: p.client,
      color: p.color,
      userId: p.userId,
      createdAt: p.createdAt,
      entryCount: p._count.timeEntries,
      totalSeconds: p.timeEntries.reduce((s, e) => s + (e.duration ?? 0), 0),
    }))

    return ok(data)
  } catch (err) {
    console.error('[projects:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const body = await req.json()
    const result = projectSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    const project = await prisma.project.create({
      data: { ...result.data, userId: session.userId },
    })

    return created(project)
  } catch (err) {
    console.error('[projects:POST]', err)
    return serverError()
  }
}
