export function safeNext(rawNext: string | null, fallback = '/dashboard') {
  if (!rawNext) return fallback
  if (!rawNext.startsWith('/') || rawNext.startsWith('//')) return fallback
  return rawNext
}
