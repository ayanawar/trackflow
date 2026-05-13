export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, unauthorized, forbidden, serverError } from '@/lib/response'
import { switchOrg } from '@/services/organization.service'

type Params = { params: { orgId: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const success = await switchOrg(session.userId, params.orgId)
    if (!success) return forbidden('Not a member of this organization')
    return ok({ activeOrgId: params.orgId })
  } catch (err) {
    console.error('[organizations/switch:POST]', err)
    return serverError()
  }
}
