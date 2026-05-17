import { z } from 'zod'

// Display-name field reused for Organization Name and Workspace Name.
// Trimmed, 1..60 chars (FR-017).
export const orgOrWorkspaceName = z
  .string()
  .trim()
  .min(1, 'required')
  .max(60, 'must be 1-60 characters')

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: orgOrWorkspaceName,
  workspaceName: orgOrWorkspaceName,
})

export const googleCompleteSchema = z.object({
  setupToken: z.string().min(1),
  organizationName: orgOrWorkspaceName,
  workspaceName: orgOrWorkspaceName,
})

export const workspaceCreateSchema = z.object({
  orgId: z.string().min(1),
  name: orgOrWorkspaceName,
})

export const workspaceDeleteSchema = z.object({
  confirmName: z.string().min(1),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const projectSchema = z.object({
  name: z.string().min(1).max(100),
  client: z.string().max(100).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#4f8ef7'),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).default('ACTIVE'),
})

export const timeEntrySchema = z.object({
  description: z.string().max(500).optional().default(''),
  projectId: z.string().nullable().optional(),
  taskId: z.string().max(200).nullable().optional(),
  tagId: z.string().nullable().optional(),
  tag: z.string().max(50).nullable().optional(),
  billable: z.boolean().optional().default(false),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().nullable().optional(),
})

export const timeEntryUpdateSchema = z.object({
  description: z.string().max(500).optional(),
  projectId: z.string().nullable().optional(),
  taskId: z.string().max(200).nullable().optional(),
  tagId: z.string().nullable().optional(),
  tag: z.string().max(50).nullable().optional(),
  billable: z.boolean().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().nullable().optional(),
})

export const stopEntrySchema = z.object({
  endTime: z.string().datetime(),
})

export const tagSchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#888888'),
})

export const tagQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'all']).optional().default('active'),
  q: z.string().trim().max(50).optional(),
  includeUsage: z
    .enum(['true', 'false'])
    .optional()
    .transform(value => value === 'true'),
})

export const tagUpdateSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Provide at least one field to update',
})

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  dailyHoursGoal: z.number().int().min(1).max(24).optional(),
})

export const aiQuerySchema = z.object({
  question: z.string().min(1).max(500),
  context: z.object({}).passthrough(),
})

export const googleAuthSchema = z.object({
  idToken: z.string().min(1),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  workspaceId: z.string().min(1, 'required'),
})

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(100),
  password: z.string().min(8),
})

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  assigneeId: z.string().optional().nullable(),
})

export const taskUpdateSchema = taskCreateSchema.partial()

export const roleSchema = z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE'])
export const teamMemberRoleSchema = z.enum(['MANAGER', 'MEMBER'])
export const projectAccessLevelSchema = z.enum(['VIEW', 'TRACK', 'MANAGE', 'APPROVE'])
export const clientAccessLevelSchema = z.enum(['VIEW', 'MANAGE', 'REPORT'])

export const adminCreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: roleSchema.default('EMPLOYEE'),
})

export const adminUpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  dailyHoursGoal: z.number().int().min(1).max(24).optional(),
  role: roleSchema.optional(),
})

export const orgSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
})

export const orgUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
})

export const teamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
})

export const teamMemberSchema = z.object({
  userId: z.string().min(1),
  memberRole: teamMemberRoleSchema.default('MEMBER'),
})

export const clientSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
})

const exactlyOneAssignee = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.refine(data => Boolean((data as any).userId) !== Boolean((data as any).teamId), {
    message: 'Provide exactly one of userId or teamId',
  })

export const projectAssignmentSchema = exactlyOneAssignee(z.object({
  userId: z.string().min(1).nullable().optional(),
  teamId: z.string().min(1).nullable().optional(),
  accessLevel: projectAccessLevelSchema.default('TRACK'),
}))

export const clientAssignmentSchema = exactlyOneAssignee(z.object({
  userId: z.string().min(1).nullable().optional(),
  teamId: z.string().min(1).nullable().optional(),
  accessLevel: clientAccessLevelSchema.default('VIEW'),
}))

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).default('EMPLOYEE'),
  workspaceId: z.string().min(1, 'required'),
})

export const memberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']),
})

export const calendarQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
  userId: z.string().optional(),
  tagId: z.string().optional(),
  projectId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
})

export const calendarRescheduleSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
})
