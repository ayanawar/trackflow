import type { Role } from '@/types'

export function makeUser(overrides: Partial<any> = {}) {
  return {
    id: 'user_admin',
    name: 'Admin User',
    email: 'admin@trackflow.test',
    workspace: 'TrackFlow Test',
    dailyHoursGoal: 8,
    role: 'ADMIN' as Role,
    createdAt: new Date(),
    ...overrides,
  }
}

export function makeSession(overrides: Partial<any> = {}) {
  const user = makeUser(overrides)
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
}

export function makeTeam(overrides: Partial<any> = {}) {
  return {
    id: 'team_1',
    name: 'Engineering',
    description: 'Engineering team',
    createdById: 'user_admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function makeClient(overrides: Partial<any> = {}) {
  return {
    id: 'client_1',
    name: 'Acme Corp',
    description: 'Primary account',
    createdById: 'user_admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function makeProject(overrides: Partial<any> = {}) {
  return {
    id: 'project_1',
    name: 'Website Redesign',
    client: 'Acme Corp',
    clientId: 'client_1',
    color: '#4f8ef7',
    userId: 'user_admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function makeTimeEntry(overrides: Partial<any> = {}) {
  return {
    id: 'entry_1',
    description: 'Implementation work',
    startTime: new Date(),
    endTime: null,
    duration: null,
    isRunning: true,
    isPaused: false,
    pausedDuration: 0,
    billable: true,
    taskId: null,
    userId: 'user_employee',
    projectId: 'project_1',
    tagId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}
