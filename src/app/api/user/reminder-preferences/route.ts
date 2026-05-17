export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, unauthorized, badRequest, serverError } from '@/lib/response'
import { getReminderPreferences, updateReminderPreferences } from '@/repositories/reminder.repository'
import { z } from 'zod'

const updateSchema = z.object({
  remindersEnabled: z.boolean().optional(),
  reminderTime: z.number().int().min(0).max(23).optional(),
  notifyManager: z.boolean().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Provide at least one field to update' })

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return unauthorized()

  try {
    const prefs = await getReminderPreferences(session.userId)
    return ok(prefs)
  } catch (err) {
    console.error('[reminder-preferences:GET]', err)
    return serverError()
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return unauthorized()

  let body: unknown
  try { body = await req.json() } catch { return badRequest('Invalid JSON') }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues[0].message)

  try {
    const prefs = await updateReminderPreferences(session.userId, parsed.data)
    return ok(prefs)
  } catch (err) {
    console.error('[reminder-preferences:PATCH]', err)
    return serverError()
  }
}
