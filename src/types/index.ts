export interface User {
  id: string
  name: string
  email: string
  workspace: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  client?: string | null
  color: string
  userId: string
  totalSeconds?: number
  entryCount?: number
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
  startTime: string
  endTime: string | null
  duration: number | null
  isRunning: boolean
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
