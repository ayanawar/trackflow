import * as securityEventRepo from '@/repositories/securityEvent.repository'
import type { SecurityEventType } from '@/types'

function sanitizeMetadata(metadata?: Record<string, unknown> | null) {
  if (!metadata) return undefined
  const blocked = new Set(['password', 'token', 'rawToken', 'refreshToken', 'accessToken', 'secret'])
  return Object.fromEntries(Object.entries(metadata).filter(([key]) => !blocked.has(key)))
}

export async function recordSecurityEvent(data: {
  type: SecurityEventType
  userId?: string | null
  email?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown> | null
}) {
  try {
    await securityEventRepo.create({ ...data, metadata: sanitizeMetadata(data.metadata) })
  } catch (err) {
    console.error('[security-event]', err)
  }
}

export function requestSecurityContext(req: Request) {
  return {
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null,
    userAgent: req.headers.get('user-agent'),
  }
}
