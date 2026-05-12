import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { timeEntryUpdateSchema } from '@/lib/schemas'
import { ok, noContent, badRequest, unauthorized, notFound, serverError } from '@/lib/response'

const include = { project: true, tag: true }

async function getEntry(id: string, userId: string) {
  const e = await prisma.timeEntry.findUnique({ where: { id }, include })
  if (!e || e.userId !== userId) return null
  return e
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session) return unauthorized()
  const entry = await getEntry(params.id, session.userId)
  if (!entry) return notFound()
  return ok(entry)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const entry = await getEntry(params.id, session.userId)
    if (!entry) return notFound()

    const body = await req.json()
    const result = timeEntryUpdateSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    const { description, projectId, tag, startTime, endTime } = result.data

    let tagId = entry.tagId
    if (tag !== undefined) {
      if (tag === null) {
        tagId = null
      } else {
        const t = await prisma.tag.upsert({
          where: { name_userId: { name: tag, userId: session.userId } },
          update: {},
          create: { name: tag, userId: session.userId },
        })
        tagId = t.id
      }
    }

    const start = startTime ? new Date(startTime) : entry.startTime
    const end = endTime !== undefined ? (endTime ? new Date(endTime) : null) : entry.endTime
    const duration = end ? Math.floor((end.getTime() - start.getTime()) / 1000) : null

    const updated = await prisma.timeEntry.update({
      where: { id: params.id },
      data: {
        ...(description !== undefined && { description }),
        ...(projectId !== undefined && { projectId: projectId ?? null }),
        tagId,
        startTime: start,
        endTime: end,
        duration,
        isRunning: !end,
      },
      include,
    })

    return ok(updated)
  } catch (err) {
    console.error('[time-entry:PUT]', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const entry = await getEntry(params.id, session.userId)
    if (!entry) return notFound()
    await prisma.timeEntry.delete({ where: { id: params.id } })
    return noContent()
  } catch (err) {
    console.error('[time-entry:DELETE]', err)
    return serverError()
  }
}
