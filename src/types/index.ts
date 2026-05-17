export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Task {
  id: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string | null
  order: number
  projectId: string
  assigneeId?: string | null
  assignee?: { id: string; name: string; avatarUrl?: string | null } | null
  createdById: string
  createdBy?: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}
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
  dailyHoursGoal?: number
  managerId?: string | null
  remindersEnabled?: boolean
  reminderTime?: number
  notifyManager?: boolean
  createdAt: string
}

export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED'

export interface ProjectAssignmentUser {
  id: string
  userId?: string | null
  user?: { id: string; name: string } | null
  accessLevel: string
}

export interface Project {
  id: string
  name: string
  client?: string | null
  clientId?: string | null
  clientRef?: Client | null
  color: string
  status?: ProjectStatus
  estimatedHours?: number | null
  userId: string
  totalSeconds?: number
  entryCount?: number
  createdAt: string
  assignments?: ProjectAssignmentUser[]
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
  normalizedName?: string | null
  color: string
  status?: 'ACTIVE' | 'INACTIVE'
  workspaceId?: string
  userId: string
  createdById?: string
  updatedById?: string | null
  usageCount?: number
  canDelete?: boolean
  createdAt?: string
  updatedAt?: string
  _count?: { timeEntries: number }
}

export interface TimeEntry {
  id: string
  description: string | null
  projectId: string | null
  project?: Project | null
  tagId: string | null
  tag?: Tag | null
  taskId: string | null
  task?: { id: string; title: string } | null
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
