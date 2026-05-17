export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { forbidden, ok, serverError, unauthorized } from '@/lib/response'
import * as workspaceService from '@/services/workspace.service'
import { WorkspaceServiceError } from '@/services/workspace.service'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    try {
      const result = await workspaceService.switchActive(session.userId, params.id)
      return ok(result)
    } catch (err) {
      if (err instanceof WorkspaceServiceError && err.code === 'FORBIDDEN') {
        return forbidden(err.message)
      }
      throw err
    }
  } catch (err) {
    console.error('[workspaces/[id]/switch:POST]', err)
    return serverError()
  }
}
