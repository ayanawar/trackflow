export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, badRequest, unauthorized, serverError } from '@/lib/response'

// GET /api/auth/me
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, workspace: true, createdAt: true },
    })
    if (!user) return unauthorized()

    return ok(user)
  } catch (err) {
    console.error('[me:GET]', err)
    return serverError()
  }
}

// PATCH /api/auth/me
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  workspace: z.string().min(1).max(100).optional(),
})

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const body = await req.json()
    const result = updateSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: result.data,
      select: { id: true, name: true, email: true, workspace: true },
    })

    return ok(user)
  } catch (err) {
    console.error('[me:PATCH]', err)
    return serverError()
  }
}
