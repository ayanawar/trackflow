export const dynamic = 'force-dynamic'

import { ok } from '@/lib/response'
import { clearTokenCookie } from '@/lib/auth'

export async function POST() {
  clearTokenCookie()
  return ok({ message: 'Logged out' })
}
