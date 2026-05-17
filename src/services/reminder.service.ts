import {
  findUsersWithoutEntriesToday,
  findProjectsOverBudget,
} from '@/repositories/reminder.repository'
import {
  sendReminderEmployee,
  sendReminderManager,
  sendProjectOverrun,
} from '@/lib/mailer'
import { getAppBaseUrl } from '@/lib/appUrl'

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export interface ReminderResult {
  employeeEmailsSent: number
  managerEmailsSent: number
  overrunEmailsSent: number
  errors: string[]
}

/**
 * Sends reminder emails to employees who haven't logged hours today,
 * and a summary to their managers.
 */
export async function runNoLogReminders(appBaseUrl?: string): Promise<ReminderResult> {
  const date = formatDate(new Date())
  const errors: string[] = []
  let employeeEmailsSent = 0
  let managerEmailsSent = 0

  console.log('[reminder.service] runNoLogReminders start — date:', date)

  const users = await findUsersWithoutEntriesToday()
  console.log(`[reminder.service] ${users.length} user(s) without entries today`)

  // Send individual employee emails
  for (const user of users) {
    try {
      await sendReminderEmployee(user.email, user.name, date, appBaseUrl)
      employeeEmailsSent++
      console.log(`[reminder.service] employee email sent → ${user.email}`)
    } catch (err) {
      const msg = `Failed to send employee email to ${user.email}: ${err}`
      console.error('[reminder.service]', msg)
      errors.push(msg)
    }
  }

  // Group missing users by manager and send one summary per manager
  const managerMap = new Map<string, { manager: { id: string; name: string; email: string }; missing: { name: string; email: string }[] }>()

  for (const user of users) {
    if (!user.notifyManager || !user.manager) continue
    const mgr = user.manager
    if (!managerMap.has(mgr.id)) {
      managerMap.set(mgr.id, { manager: mgr, missing: [] })
    }
    managerMap.get(mgr.id)!.missing.push({ name: user.name, email: user.email })
  }

  for (const { manager, missing } of Array.from(managerMap.values())) {
    try {
      await sendReminderManager(manager.email, manager.name, date, missing, undefined, appBaseUrl)
      managerEmailsSent++
      console.log(`[reminder.service] manager email sent → ${manager.email} (${missing.length} member(s))`)
    } catch (err) {
      const msg = `Failed to send manager email to ${manager.email}: ${err}`
      console.error('[reminder.service]', msg)
      errors.push(msg)
    }
  }

  return { employeeEmailsSent, managerEmailsSent, overrunEmailsSent: 0, errors }
}

/**
 * Finds projects over their hour budget and emails the project owner.
 */
export async function runOverrunReminders(appBaseUrl?: string): Promise<ReminderResult> {
  const errors: string[] = []
  let overrunEmailsSent = 0

  console.log('[reminder.service] runOverrunReminders start')

  const projects = await findProjectsOverBudget()
  console.log(`[reminder.service] ${projects.length} project(s) over budget`)

  for (const project of projects) {
    try {
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
      overrunEmailsSent++
      console.log(`[reminder.service] overrun email sent → ${project.owner.email} (project: ${project.name}, logged: ${project.loggedHours.toFixed(1)}h / ${project.estimatedHours}h)`)
    } catch (err) {
      const msg = `Failed to send overrun email for project "${project.name}" to ${project.owner.email}: ${err}`
      console.error('[reminder.service]', msg)
      errors.push(msg)
    }
  }

  return { employeeEmailsSent: 0, managerEmailsSent: 0, overrunEmailsSent, errors }
}

/** Runs both reminder types and returns a combined result. */
export async function runAllReminders(): Promise<ReminderResult> {
  const appBaseUrl = getAppBaseUrl()
  console.log('[reminder.service] runAllReminders — appBaseUrl:', appBaseUrl)

  const [noLog, overrun] = await Promise.all([
    runNoLogReminders(appBaseUrl),
    runOverrunReminders(appBaseUrl),
  ])

  return {
    employeeEmailsSent: noLog.employeeEmailsSent,
    managerEmailsSent: noLog.managerEmailsSent,
    overrunEmailsSent: overrun.overrunEmailsSent,
    errors: [...noLog.errors, ...overrun.errors],
  }
}
