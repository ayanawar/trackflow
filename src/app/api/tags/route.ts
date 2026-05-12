import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { tagSchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/response'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return unauthorized()
  const tags = await prisma.tag.findMany({ where: { userId: session.userId }, orderBy: { name: 'asc' } })
  return ok(tags)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json()
    const result = tagSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    const tag = await prisma.tag.upsert({
      where: { name_userId: { name: result.data.name, userId: session.userId } },
      update: {},
      create: { ...result.data, userId: session.userId },
    })
    return created(tag)
  } catch (err) {
    console.error('[tags:POST]', err)
    return serverError()
  }
}
