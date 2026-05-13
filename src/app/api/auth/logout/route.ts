export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { ok } from '@/lib/response'
import { clearTokenCookie, clearRefreshCookie, getRefreshFromRequest } from '@/lib/auth'
import { logout } from '@/services/auth.service'
import { recordSecurityEvent, requestSecurityContext } from '@/services/securityEvent.service'

export async function POST(req: NextRequest) {
  const rawRefreshToken = getRefreshFromRequest(req)
  await logout(rawRefreshToken ?? undefined)
  await recordSecurityEvent({ type: 'LOGOUT', ...requestSecurityContext(req) })
  clearTokenCookie()
  clearRefreshCookie()
  return ok({ message: 'Logged out' })
}
