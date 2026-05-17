export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, unauthorized, forbidden, notFound, serverError } from '@/lib/response'
import * as workspaceRepo from '@/repositories/workspace.repository'
import * as userRepo from '@/repositories/user.repository'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    if (session.role === 'EMPLOYEE') return forbidden()

    const isMember = await workspaceRepo.isMember(params.id, session.userId)
    if (!isMember) return notFound()

    const members = await userRepo.findAllByWorkspaceId(params.id)
    return ok(members)
  } catch (err) {
    console.error('[workspaces/[id]/members:GET]', err)
    return serverError()
  }
}
