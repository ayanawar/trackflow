import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { timeEntrySchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/response'

const entryInclude = {
  project: true,
  tag: true,
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500)

    const entries = await prisma.timeEntry.findMany({
      where: { userId: session.userId },
      orderBy: { startTime: 'desc' },
      take: limit,
      include: entryInclude,
    })

    return ok(entries)
  } catch (err) {
    console.error('[time-entries:GET]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const body = await req.json()
    const result = timeEntrySchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    const { description, projectId, tag, startTime, endTime } = result.data

    // Stop any currently running entry
    await prisma.timeEntry.updateMany({
      where: { userId: session.userId, isRunning: true },
      data: {
        endTime: new Date(),
        isRunning: false,
        duration: undefined, // will be left as-is; calculate below if needed
      },
    })

    // Resolve or create tag
    let tagId: string | null = null
    if (tag) {
      const existing = await prisma.tag.upsert({
        where: { name_userId: { name: tag, userId: session.userId } },
        update: {},
        create: { name: tag, userId: session.userId },
      })
      tagId = existing.id
    }

    const isRunning = !endTime
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : null
    const duration = end ? Math.floor((end.getTime() - start.getTime()) / 1000) : null

    const entry = await prisma.timeEntry.create({
      data: {
        description: description ?? '',
        projectId: projectId ?? null,
        tagId,
        userId: session.userId,
        startTime: start,
        endTime: end,
        duration,
        isRunning,
      },
      include: entryInclude,
    })

    return created(entry)
  } catch (err) {
    console.error('[time-entries:POST]', err)
    return serverError()
  }
}
