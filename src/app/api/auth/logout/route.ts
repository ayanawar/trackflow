import { ok } from '@/lib/response'
import { clearTokenCookie } from '@/lib/auth'

export async function POST() {
  clearTokenCookie()
  return ok({ message: 'Logged out' })
}
