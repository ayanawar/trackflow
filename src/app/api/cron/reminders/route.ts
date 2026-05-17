export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { ok, unauthorized, serverError } from '@/lib/response'
import { runAllReminders } from '@/services/reminder.service'

/**
 * GET /api/cron/reminders
 *
 * Called by Vercel Cron at 18:00 UTC daily.
 * Protected by CRON_SECRET — Vercel sends this as the Authorization header.
 * Never returns a 5xx on partial failures; individual email errors are logged
 * and collected in the result so the cron job is not retried unnecessarily.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (!secret) {
    console.error('[cron/reminders] CRON_SECRET env var is not set — refusing to run')
    return unauthorized('CRON_SECRET not configured')
  }

  if (authHeader !== `Bearer ${secret}`) {
    console.warn('[cron/reminders] Unauthorized request — invalid Bearer token')
    return unauthorized()
  }

  console.log('[cron/reminders] Authorized — starting reminder run at', new Date().toISOString())

  try {
    const result = await runAllReminders()

    console.log('[cron/reminders] Complete:', result)

    return ok({
      ok: true,
      timestamp: new Date().toISOString(),
      employeeEmailsSent: result.employeeEmailsSent,
      managerEmailsSent: result.managerEmailsSent,
      overrunEmailsSent: result.overrunEmailsSent,
      errorCount: result.errors.length,
      errors: result.errors,
    })
  } catch (err) {
    console.error('[cron/reminders] Unhandled error:', err)
    return serverError('Reminder cron failed')
  }
}
