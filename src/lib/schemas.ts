import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  workspace: z.string().min(1).max(100).optional().default('My Workspace'),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const projectSchema = z.object({
  name: z.string().min(1).max(100),
  client: z.string().max(100).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#4f8ef7'),
})

export const timeEntrySchema = z.object({
  description: z.string().max(500).optional().default(''),
  projectId: z.string().nullable().optional(),
  taskId: z.string().max(200).nullable().optional(),
  tag: z.string().max(50).nullable().optional(),
  billable: z.boolean().optional().default(false),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().nullable().optional(),
})

export const timeEntryUpdateSchema = z.object({
  description: z.string().max(500).optional(),
  projectId: z.string().nullable().optional(),
  taskId: z.string().max(200).nullable().optional(),
  tag: z.string().max(50).nullable().optional(),
  billable: z.boolean().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().nullable().optional(),
})

export const stopEntrySchema = z.object({
  endTime: z.string().datetime(),
})

export const tagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#888888'),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  workspace: z.string().min(1).max(100).optional(),
  dailyHoursGoal: z.number().int().min(1).max(24).optional(),
})

export const aiQuerySchema = z.object({
  question: z.string().min(1).max(500),
  context: z.object({}).passthrough(),
})

export const googleAuthSchema = z.object({
  idToken: z.string().min(1),
})
