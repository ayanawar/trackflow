export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { unauthorized, badRequest } from '@/lib/response'
import { aiQuerySchema } from '@/lib/schemas'
import { askAI, RateLimitError, ServiceUnavailableError } from '@/services/insights.service'

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return unauthorized()

  let body: unknown
  try { body = await req.json() } catch { return badRequest('Invalid JSON') }

  const result = aiQuerySchema.safeParse(body)
  if (!result.success) return badRequest(result.error.issues[0].message)

  try {
    const { answer } = await askAI(session.userId, result.data.question, result.data.context)
    return NextResponse.json({ answer })
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before asking again.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
    if (err instanceof ServiceUnavailableError) {
      return NextResponse.json({ error: 'AI is unavailable, please try again.' }, { status: 503 })
    }
    console.error('[ai/query:POST]', err)
    return NextResponse.json({ error: 'AI is unavailable, please try again.' }, { status: 503 })
  }
}
