const windows = new Map<string, number[]>()

export function checkRateLimit(
  userId: string,
  limit: number,
  windowMs: number
): { allowed: boolean } {
  const now = Date.now()
  const key = userId
  const timestamps = (windows.get(key) ?? []).filter(t => now - t < windowMs)
  if (timestamps.length >= limit) {
    windows.set(key, timestamps)
    return { allowed: false }
  }
  timestamps.push(now)
  windows.set(key, timestamps)
  return { allowed: true }
}

export function rateLimitKey(req: Request, scope: string) {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = req.headers.get('x-real-ip')?.trim()
  return `${scope}:${forwardedFor || realIp || '127.0.0.1'}`
}
