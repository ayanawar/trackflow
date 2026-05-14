export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, unauthorized, notFound, serverError } from '@/lib/response'
import { listMembers } from '@/services/organization.service'

type Params = { params: { orgId: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const members = await listMembers(params.orgId, session.userId)
    if (members === null) return notFound('Organization not found')
    return ok(members)
  } catch (err) {
    console.error('[members:GET]', err)
    return serverError()
  }
}
