export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { unauthorized, forbidden, badRequest, ok, serverError } from '@/lib/response'
import { runNoLogReminders, runOverrunReminders } from '@/services/reminder.service'
import { findUsersWithoutEntriesToday, findProjectsOverBudget } from '@/repositories/reminder.repository'
import { sendReminderEmployee, sendReminderManager, sendProjectOverrun } from '@/lib/mailer'
import { getAppBaseUrl } from '@/lib/appUrl'
import { z } from 'zod'

const testSchema = z.object({
  type: z.enum(['no-log', 'overrun']),
  userId: z.string().optional(),
  projectId: z.string().optional(),
  dryRun: z.boolean().optional().default(false),
})

/**
 * POST /api/reminders/test
 *
 * Manual trigger for testing reminders without waiting for the cron schedule.
 * Requires ADMIN or MANAGER role.
 *
 * Body:
 *   { type: "no-log" | "overrun", userId?: string, projectId?: string, dryRun?: boolean }
 *
 * When userId/projectId is provided, only that specific user/project is targeted.
 * When dryRun is true, emails are not sent — only the affected users/projects are returned.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return unauthorized()
  if (session.role !== 'ADMIN' && session.role !== 'MANAGER') return forbidden('Requires ADMIN or MANAGER role')

  let body: unknown
  try { body = await req.json() } catch { return badRequest('Invalid JSON') }

  const parsed = testSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues[0].message)

  const { type, userId, projectId, dryRun } = parsed.data
  const appBaseUrl = getAppBaseUrl(req)

  try {
    if (type === 'no-log') {
      if (userId) {
        // Target a single user
        const users = await findUsersWithoutEntriesToday()
        const user = users.find(u => u.id === userId)

        if (!user) {
          return ok({
            ok: true,
            message: 'User has already logged hours today or reminders are disabled',
            dryRun,
            affected: [],
          })
        }

        if (!dryRun) {
          const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
          await sendReminderEmployee(user.email, user.name, date, appBaseUrl)
          console.log(`[reminders/test] employee email sent → ${user.email}`)

          if (user.notifyManager && user.manager) {
            await sendReminderManager(user.manager.email, user.manager.name, date, [{ name: user.name, email: user.email }], undefined, appBaseUrl)
            console.log(`[reminders/test] manager email sent → ${user.manager.email}`)
          }
        }

        return ok({ ok: true, dryRun, affected: [{ id: user.id, name: user.name, email: user.email }] })
      }

      // Run for all users
      if (dryRun) {
        const users = await findUsersWithoutEntriesToday()
        return ok({ ok: true, dryRun: true, type: 'no-log', affected: users.map(u => ({ id: u.id, name: u.name, email: u.email })) })
      }

      const result = await runNoLogReminders(appBaseUrl)
      return ok({ ok: true, dryRun: false, ...result })
    }

    if (type === 'overrun') {
      if (projectId) {
        // Target a single project
        const projects = await findProjectsOverBudget()
        const project = projects.find(p => p.id === projectId)

        if (!project) {
          return ok({
            ok: true,
            message: 'Project is within budget or does not have an estimated hours budget set',
            dryRun,
            affected: [],
          })
        }

        if (!dryRun) {
          await sendProjectOverrun(
            project.owner.email,
            project.owner.name,
            {
              name: project.name,
              color: project.color,
              estimatedHours: project.estimatedHours,
              loggedHours: project.loggedHours,
            },
            appBaseUrl
          )
          console.log(`[reminders/test] overrun email sent → ${project.owner.email} (${project.name})`)
        }

        return ok({
          ok: true,
          dryRun,
          affected: [{
            id: project.id,
            name: project.name,
            loggedHours: project.loggedHours,
            estimatedHours: project.estimatedHours,
          }],
        })
      }

      // Run for all over-budget projects
      if (dryRun) {
        const projects = await findProjectsOverBudget()
        return ok({
          ok: true,
          dryRun: true,
          type: 'overrun',
          affected: projects.map(p => ({
            id: p.id,
            name: p.name,
            loggedHours: p.loggedHours,
            estimatedHours: p.estimatedHours,
            overrunPercent: Math.round(((p.loggedHours - p.estimatedHours) / p.estimatedHours) * 100),
          })),
        })
      }

      const result = await runOverrunReminders(appBaseUrl)
      return ok({ ok: true, dryRun: false, ...result })
    }

    return badRequest('Unknown type')
  } catch (err) {
    console.error('[reminders/test]', err)
    return serverError()
  }
}
