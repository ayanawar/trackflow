export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
export type TeamMemberRole = 'MANAGER' | 'MEMBER'
export type ProjectAccessLevel = 'VIEW' | 'TRACK' | 'MANAGE' | 'APPROVE'
export type ClientAccessLevel = 'VIEW' | 'MANAGE' | 'REPORT'
export type SecurityEventType =
  | 'LOGIN_FAILED'
  | 'LOGIN_SUCCEEDED'
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_FAILED'
  | 'PASSWORD_RESET_SUCCEEDED'
  | 'REFRESH_FAILED'
  | 'REFRESH_REUSED'
  | 'RATE_LIMITED'
  | 'FORBIDDEN'

export interface User {
  id: string
  name: string
  email: string
  workspace: string
  role: Role
  createdAt: string
}

export interface Project {
  id: string
  name: string
  client?: string | null
  clientId?: string | null
  clientRef?: Client | null
  color: string
  userId: string
  totalSeconds?: number
  entryCount?: number
  createdAt: string
}

export interface Team {
  id: string
  name: string
  description?: string | null
  createdById: string
  createdAt: string
  updatedAt?: string
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  memberRole: TeamMemberRole
}

export interface Client {
  id: string
  name: string
  description?: string | null
  createdById: string
  createdAt: string
  updatedAt?: string
}

export interface ProjectAssignment {
  id: string
  projectId: string
  userId?: string | null
  teamId?: string | null
  accessLevel: ProjectAccessLevel
}

export interface ClientAssignment {
  id: string
  clientId: string
  userId?: string | null
  teamId?: string | null
  accessLevel: ClientAccessLevel
}

export interface SecurityEvent {
  id: string
  type: SecurityEventType
  userId?: string | null
  email?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  color: string
  userId: string
}

export interface TimeEntry {
  id: string
  description: string | null
  projectId: string | null
  project?: Project | null
  tagId: string | null
  tag?: Tag | null
  taskId: string | null
  startTime: string
  endTime: string | null
  duration: number | null
  isRunning: boolean
  isPaused: boolean
  pausedDuration: number
  billable: boolean
  userId: string
  createdAt: string
}

export interface Stats {
  todaySeconds: number
  weekSeconds: number
  monthSeconds: number
  totalEntries: number
  topProject: (Project & { totalSeconds: number }) | null
  dailyTotals: { date: string; seconds: number }[]
}
