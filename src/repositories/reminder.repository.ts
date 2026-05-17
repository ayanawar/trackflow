import prisma from '@/lib/prisma'

export interface UserWithoutEntry {
  id: string
  name: string
  email: string
  managerId: string | null
  notifyManager: boolean
  manager: { id: string; name: string; email: string } | null
}

export interface OverBudgetProject {
  id: string
  name: string
  color: string
  estimatedHours: number
  loggedHours: number
  owner: { id: string; name: string; email: string }
}

/** Returns users who have reminders enabled and logged zero hours today. */
export async function findUsersWithoutEntriesToday(): Promise<UserWithoutEntry[]> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  // Fetch all reminder-enabled users with their today entries in one query
  const users = await prisma.user.findMany({
    where: { remindersEnabled: true },
    select: {
      id: true,
      name: true,
      email: true,
      managerId: true,
      notifyManager: true,
      manager: { select: { id: true, name: true, email: true } },
      timeEntries: {
        where: { startTime: { gte: todayStart, lte: todayEnd } },
        select: { id: true },
        take: 1,
      },
    },
  })

  return users
    .filter(u => u.timeEntries.length === 0)
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      managerId: u.managerId,
      notifyManager: u.notifyManager,
      manager: u.manager,
    }))
}

/** Returns projects with estimatedHours set where total logged time exceeds the budget. */
export async function findProjectsOverBudget(): Promise<OverBudgetProject[]> {
  const projects = await prisma.project.findMany({
    where: {
      estimatedHours: { not: null, gt: 0 },
      status: { in: ['ACTIVE', 'ON_HOLD'] },
    },
    select: {
      id: true,
      name: true,
      color: true,
      estimatedHours: true,
      userId: true,
      user: { select: { id: true, name: true, email: true } },
      timeEntries: {
        where: { duration: { not: null }, isRunning: false },
        select: { duration: true },
      },
    },
  })

  return projects
    .map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      estimatedHours: p.estimatedHours!,
      loggedHours: (p.timeEntries.reduce((s, e) => s + (e.duration ?? 0), 0)) / 3600,
      owner: p.user,
    }))
    .filter(p => p.loggedHours > p.estimatedHours)
}

export async function getReminderPreferences(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { remindersEnabled: true, reminderTime: true, notifyManager: true, managerId: true },
  })
}

export async function updateReminderPreferences(
  userId: string,
  data: { remindersEnabled?: boolean; reminderTime?: number; notifyManager?: boolean }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { remindersEnabled: true, reminderTime: true, notifyManager: true, managerId: true },
  })
}
