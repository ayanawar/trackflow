export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { projectSchema } from '@/lib/schemas'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/response'
import { listProjects, createProject } from '@/services/project.service'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    return ok(await listProjects(session.userId))
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
    return created(await createProject(session.userId, result.data))
  } catch (err) {
    console.error('[projects:POST]', err)
    return serverError()
  }
}
