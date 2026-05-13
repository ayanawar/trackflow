export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { orgUpdateSchema } from '@/lib/schemas'
import { ok, badRequest, unauthorized, forbidden, notFound, noContent, serverError } from '@/lib/response'
import { getOrg, updateOrg, deleteOrg } from '@/services/organization.service'

type Params = { params: { orgId: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const org = await getOrg(params.orgId, session.userId)
    if (!org) return notFound('Organization not found')
    return ok(org)
  } catch (err) {
    console.error('[organizations/[orgId]:GET]', err)
    return serverError()
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const body = await req.json()
    const result = orgUpdateSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)
    const org = await updateOrg(params.orgId, session.userId, result.data)
    if (!org) return forbidden()
    return ok(org)
  } catch (err) {
    console.error('[organizations/[orgId]:PUT]', err)
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const ok2 = await deleteOrg(params.orgId, session.userId)
    if (!ok2) return forbidden('Only the owner can delete an organization')
    return noContent()
  } catch (err) {
    console.error('[organizations/[orgId]:DELETE]', err)
    return serverError()
  }
}
