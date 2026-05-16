const auth = [{ cookieAuth: [] }]
const noAuth: never[] = []

const Err = { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
const r401 = { description: 'Not authenticated', content: Err }
const r403 = { description: 'Forbidden — insufficient role', content: Err }
const r404 = { description: 'Not found', content: Err }
const r400 = { description: 'Validation error', content: Err }
const r409 = { description: 'Conflict', content: Err }
const r429 = { description: 'Rate limit exceeded', content: Err }

function param(name: string, desc?: string) {
  return { name, in: 'path' as const, required: true, schema: { type: 'string' }, description: desc }
}

function json(schema: object) {
  return { required: true, content: { 'application/json': { schema } } }
}

export function getOpenAPISpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'TrackFlow API',
      version: '2.0.0',
      description: [
        'Full REST API for TrackFlow — time tracking, organizations, teams, projects, and admin management.',
        '',
        '**Authentication**: httpOnly cookies — `tf_token` (15 min access token) and `tf_refresh` (30 day refresh token).',
        'Obtain tokens via `POST /auth/login`, `POST /auth/register`, or `POST /auth/google`.',
        'Refresh silently via `POST /auth/refresh`.',
        '',
        '**Roles**: `ADMIN > MANAGER > EMPLOYEE`. Role restrictions are noted per endpoint.',
      ].join('\n'),
    },
    servers: [{ url: '/api', description: 'Current server' }],
    tags: [
      { name: 'Auth',          description: 'Authentication, session management, and profile' },
      { name: 'Time Entries',  description: 'Create, read, update, delete and control time entries' },
      { name: 'Projects',      description: 'Project management' },
      { name: 'Tags',          description: 'Tag management' },
      { name: 'Stats',         description: 'Aggregated time statistics' },
      { name: 'Insights',      description: 'AI-powered productivity insights' },
      { name: 'Organizations', description: 'Multi-tenant organization management' },
      { name: 'Invitations',   description: 'Organization invitation flow' },
      { name: 'Admin',         description: 'Admin-only workspace management (ADMIN role required)' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'tf_token',
          description: 'Short-lived access token (15 min). Refresh via POST /auth/refresh.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: { error: { type: 'string' } },
          required: ['error'],
        },
        User: {
          type: 'object',
          properties: {
            id:             { type: 'string' },
            name:           { type: 'string' },
            email:          { type: 'string', format: 'email' },
            workspace:      { type: 'string' },
            role:           { type: 'string', enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
            dailyHoursGoal: { type: 'integer', minimum: 1, maximum: 24 },
            activeOrgId:    { type: 'string', nullable: true },
            avatarUrl:      { type: 'string', nullable: true },
            createdAt:      { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id:        { type: 'string' },
            name:      { type: 'string' },
            client:    { type: 'string', nullable: true },
            clientId:  { type: 'string', nullable: true },
            color:     { type: 'string', example: '#4f8ef7' },
            userId:    { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Tag: {
          type: 'object',
          properties: {
            id:             { type: 'string' },
            name:           { type: 'string' },
            normalizedName: { type: 'string', nullable: true },
            color:          { type: 'string', example: '#888888' },
            status:         { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
            workspaceId:    { type: 'string' },
            userId:         { type: 'string' },
            createdById:    { type: 'string' },
            updatedById:    { type: 'string', nullable: true },
            usageCount:     { type: 'integer' },
            canDelete:      { type: 'boolean' },
            createdAt:      { type: 'string', format: 'date-time' },
            updatedAt:      { type: 'string', format: 'date-time' },
          },
        },
        TimeEntry: {
          type: 'object',
          properties: {
            id:             { type: 'string' },
            description:    { type: 'string', nullable: true },
            startTime:      { type: 'string', format: 'date-time' },
            endTime:        { type: 'string', format: 'date-time', nullable: true },
            duration:       { type: 'integer', nullable: true, description: 'Duration in seconds' },
            isRunning:      { type: 'boolean' },
            isPaused:       { type: 'boolean' },
            pausedDuration: { type: 'integer', description: 'Total paused seconds' },
            billable:       { type: 'boolean' },
            status:         { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'] },
            userId:         { type: 'string' },
            projectId:      { type: 'string', nullable: true },
            tagId:          { type: 'string', nullable: true },
            createdAt:      { type: 'string', format: 'date-time' },
          },
        },
        Organization: {
          type: 'object',
          properties: {
            id:        { type: 'string' },
            name:      { type: 'string' },
            slug:      { type: 'string' },
            avatarUrl: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Membership: {
          type: 'object',
          properties: {
            id:        { type: 'string' },
            userId:    { type: 'string' },
            orgId:     { type: 'string' },
            role:      { type: 'string', enum: ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Invitation: {
          type: 'object',
          properties: {
            id:         { type: 'string' },
            email:      { type: 'string', format: 'email' },
            orgId:      { type: 'string' },
            role:       { type: 'string' },
            token:      { type: 'string' },
            expiresAt:  { type: 'string', format: 'date-time' },
            acceptedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt:  { type: 'string', format: 'date-time' },
          },
        },
        Team: {
          type: 'object',
          properties: {
            id:          { type: 'string' },
            name:        { type: 'string' },
            description: { type: 'string', nullable: true },
            orgId:       { type: 'string', nullable: true },
            createdAt:   { type: 'string', format: 'date-time' },
          },
        },
        TeamMember: {
          type: 'object',
          properties: {
            userId:     { type: 'string' },
            teamId:     { type: 'string' },
            memberRole: { type: 'string', enum: ['MANAGER', 'MEMBER'] },
          },
        },
        Client: {
          type: 'object',
          properties: {
            id:          { type: 'string' },
            name:        { type: 'string' },
            description: { type: 'string', nullable: true },
            createdAt:   { type: 'string', format: 'date-time' },
          },
        },
        ProjectAssignment: {
          type: 'object',
          properties: {
            projectId:   { type: 'string' },
            userId:      { type: 'string', nullable: true },
            teamId:      { type: 'string', nullable: true },
            accessLevel: { type: 'string', enum: ['VIEW', 'TRACK', 'MANAGE', 'APPROVE'] },
          },
        },
        ClientAssignment: {
          type: 'object',
          properties: {
            clientId:    { type: 'string' },
            userId:      { type: 'string', nullable: true },
            teamId:      { type: 'string', nullable: true },
            accessLevel: { type: 'string', enum: ['VIEW', 'MANAGE', 'REPORT'] },
          },
        },
        SecurityEvent: {
          type: 'object',
          properties: {
            id:        { type: 'string' },
            type:      { type: 'string' },
            userId:    { type: 'string', nullable: true },
            email:     { type: 'string', nullable: true },
            ipAddress: { type: 'string', nullable: true },
            userAgent: { type: 'string', nullable: true },
            metadata:  { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },

    paths: {

      // ─── Auth ────────────────────────────────────────────────────
      '/auth/register': {
        post: {
          tags: ['Auth'], summary: 'Register a new account', security: noAuth,
          requestBody: json({
            type: 'object', required: ['name', 'email', 'password', 'workspace'],
            properties: {
              name:      { type: 'string', minLength: 1, maxLength: 100 },
              email:     { type: 'string', format: 'email' },
              password:  { type: 'string', minLength: 8 },
              workspace: { type: 'string', minLength: 1, maxLength: 100 },
            },
          }),
          responses: {
            201: { description: 'Account created. Sets tf_token & tf_refresh cookies.', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } } } } } },
            400: { description: 'Validation error or email taken', content: Err },
            429: r429,
          },
        },
      },

      '/auth/login': {
        post: {
          tags: ['Auth'], summary: 'Login with email + password', security: noAuth,
          requestBody: json({
            type: 'object', required: ['email', 'password'],
            properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
          }),
          responses: {
            200: { description: 'Login successful. Sets tf_token & tf_refresh cookies.', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } } } } } },
            400: r400, 401: { description: 'Invalid credentials', content: Err }, 429: r429,
          },
        },
      },

      '/auth/logout': {
        post: {
          tags: ['Auth'], summary: 'Logout — revoke refresh token and clear cookies', security: auth,
          responses: { 200: { description: 'Logged out. Cookies cleared.' } },
        },
      },

      '/auth/refresh': {
        post: {
          tags: ['Auth'], summary: 'Rotate refresh token and issue new access token', security: noAuth,
          description: 'Reads tf_refresh cookie. Implements refresh token rotation with family-based reuse detection.',
          responses: {
            200: { description: 'New tokens issued.', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' } } } } } },
            401: { description: 'Invalid, expired, or reused refresh token', content: Err },
          },
        },
      },

      '/auth/me': {
        get: {
          tags: ['Auth'], summary: 'Get current user profile', security: auth,
          responses: { 200: { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }, 401: r401 },
        },
        patch: {
          tags: ['Auth'], summary: 'Update current user profile', security: auth,
          requestBody: json({
            type: 'object',
            properties: {
              name:           { type: 'string', minLength: 1, maxLength: 100 },
              workspace:      { type: 'string', minLength: 1, maxLength: 100 },
              dailyHoursGoal: { type: 'integer', minimum: 1, maximum: 24 },
            },
          }),
          responses: { 200: { description: 'Updated profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }, 400: r400, 401: r401 },
        },
      },

      '/auth/google': {
        post: {
          tags: ['Auth'], summary: 'Sign in / sign up with Google ID token', security: noAuth,
          requestBody: json({ type: 'object', required: ['idToken'], properties: { idToken: { type: 'string' } } }),
          responses: {
            200: { description: 'Authenticated. Sets cookies.', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } } } } } },
            400: { description: 'Email already registered with password account', content: Err },
            401: { description: 'Invalid Google token', content: Err },
          },
        },
      },

      '/auth/forgot-password': {
        post: {
          tags: ['Auth'], summary: 'Request password reset (always returns 200)', security: noAuth,
          description: 'Always 200 to prevent email enumeration. Token is logged to console.',
          requestBody: json({ type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } }),
          responses: { 200: { description: 'Reset token sent (if account exists).' }, 429: r429 },
        },
      },

      '/auth/reset-password': {
        post: {
          tags: ['Auth'], summary: 'Reset password with one-time token', security: noAuth,
          requestBody: json({
            type: 'object', required: ['token', 'password'],
            properties: { token: { type: 'string' }, password: { type: 'string', minLength: 8 } },
          }),
          responses: { 200: { description: 'Password updated. All sessions revoked.' }, 400: r400 },
        },
      },

      '/auth/invite': {
        get: {
          tags: ['Auth'], summary: 'Lookup invite token metadata', security: noAuth,
          parameters: [{ name: 'token', in: 'query', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Invite info', content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, role: { type: 'string' }, workspace: { type: 'string' } } } } } },
            400: { description: 'Invalid or expired invite', content: Err },
          },
        },
        post: {
          tags: ['Auth'], summary: 'Accept an invite — create account', security: noAuth,
          requestBody: json({
            type: 'object', required: ['token', 'name', 'password'],
            properties: { token: { type: 'string' }, name: { type: 'string' }, password: { type: 'string', minLength: 8 } },
          }),
          responses: {
            201: { description: 'Account created. Sets cookies.', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } } } } } },
            400: r400,
          },
        },
      },

      // ─── Time Entries ────────────────────────────────────────────
      '/time-entries': {
        get: {
          tags: ['Time Entries'], summary: 'List time entries for the current user', security: auth,
          parameters: [
            { name: 'from',      in: 'query', schema: { type: 'string', format: 'date' }, description: 'Start date (ISO 8601)' },
            { name: 'to',        in: 'query', schema: { type: 'string', format: 'date' }, description: 'End date (ISO 8601)' },
            { name: 'projectId', in: 'query', schema: { type: 'string' } },
            { name: 'tagId',     in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'List of time entries', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TimeEntry' } } } } },
            401: r401,
          },
        },
        post: {
          tags: ['Time Entries'], summary: 'Create / start a time entry', security: auth,
          requestBody: json({
            type: 'object', required: ['startTime'],
            properties: {
              description: { type: 'string' },
              startTime:   { type: 'string', format: 'date-time' },
              projectId:   { type: 'string', nullable: true },
              tagId:       { type: 'string', nullable: true },
              billable:    { type: 'boolean', default: false },
            },
          }),
          responses: {
            201: { description: 'Time entry created', content: { 'application/json': { schema: { $ref: '#/components/schemas/TimeEntry' } } } },
            400: r400, 401: r401,
          },
        },
      },

      '/time-entries/{id}': {
        parameters: [param('id', 'Time entry ID')],
        get: {
          tags: ['Time Entries'], summary: 'Get a single time entry', security: auth,
          responses: { 200: { description: 'Time entry', content: { 'application/json': { schema: { $ref: '#/components/schemas/TimeEntry' } } } }, 401: r401, 404: r404 },
        },
        patch: {
          tags: ['Time Entries'], summary: 'Update a time entry', security: auth,
          requestBody: json({
            type: 'object',
            properties: {
              description: { type: 'string' },
              startTime:   { type: 'string', format: 'date-time' },
              endTime:     { type: 'string', format: 'date-time', nullable: true },
              projectId:   { type: 'string', nullable: true },
              tagId:       { type: 'string', nullable: true },
              billable:    { type: 'boolean' },
            },
          }),
          responses: { 200: { description: 'Updated entry', content: { 'application/json': { schema: { $ref: '#/components/schemas/TimeEntry' } } } }, 400: r400, 401: r401, 404: r404 },
        },
        delete: {
          tags: ['Time Entries'], summary: 'Delete a time entry', security: auth,
          responses: { 204: { description: 'Deleted' }, 401: r401, 404: r404 },
        },
      },

      '/time-entries/{id}/stop': {
        parameters: [param('id', 'Time entry ID')],
        post: {
          tags: ['Time Entries'], summary: 'Stop a running timer', security: auth,
          responses: { 200: { description: 'Timer stopped', content: { 'application/json': { schema: { $ref: '#/components/schemas/TimeEntry' } } } }, 400: r400, 401: r401, 404: r404 },
        },
      },

      '/time-entries/{id}/pause': {
        parameters: [param('id', 'Time entry ID')],
        post: {
          tags: ['Time Entries'], summary: 'Pause a running timer', security: auth,
          responses: { 200: { description: 'Timer paused', content: { 'application/json': { schema: { $ref: '#/components/schemas/TimeEntry' } } } }, 400: r400, 401: r401, 404: r404 },
        },
      },

      '/time-entries/{id}/resume': {
        parameters: [param('id', 'Time entry ID')],
        post: {
          tags: ['Time Entries'], summary: 'Resume a paused timer', security: auth,
          responses: { 200: { description: 'Timer resumed', content: { 'application/json': { schema: { $ref: '#/components/schemas/TimeEntry' } } } }, 400: r400, 401: r401, 404: r404 },
        },
      },

      // ─── Projects ────────────────────────────────────────────────
      '/projects': {
        get: {
          tags: ['Projects'], summary: 'List projects for current user', security: auth,
          responses: { 200: { description: 'Projects list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Project' } } } } }, 401: r401 },
        },
        post: {
          tags: ['Projects'], summary: 'Create a project', security: auth,
          requestBody: json({
            type: 'object', required: ['name'],
            properties: {
              name:     { type: 'string', minLength: 1, maxLength: 100 },
              client:   { type: 'string', nullable: true },
              clientId: { type: 'string', nullable: true },
              color:    { type: 'string', default: '#4f8ef7' },
            },
          }),
          responses: { 201: { description: 'Project created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } }, 400: r400, 401: r401 },
        },
      },

      '/projects/{id}': {
        parameters: [param('id', 'Project ID')],
        patch: {
          tags: ['Projects'], summary: 'Update a project', security: auth,
          requestBody: json({ type: 'object', properties: { name: { type: 'string' }, client: { type: 'string', nullable: true }, color: { type: 'string' } } }),
          responses: { 200: { description: 'Updated project', content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } }, 400: r400, 401: r401, 404: r404 },
        },
        delete: {
          tags: ['Projects'], summary: 'Delete a project', security: auth,
          responses: { 204: { description: 'Deleted' }, 401: r401, 404: r404 },
        },
      },

      // ─── Tags ────────────────────────────────────────────────────
      '/tags': {
        get: {
          tags: ['Tags'], summary: 'List workspace tags', security: auth,
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive', 'all'], default: 'active' } },
            { name: 'q', in: 'query', schema: { type: 'string', maxLength: 50 } },
            { name: 'includeUsage', in: 'query', schema: { type: 'boolean' } },
          ],
          responses: { 200: { description: 'Tags list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Tag' } } } } }, 401: r401, 403: r403 },
        },
        post: {
          tags: ['Tags'], summary: 'Create a workspace tag', security: auth,
          requestBody: json({ type: 'object', required: ['name'], properties: { name: { type: 'string', minLength: 1, maxLength: 50 }, color: { type: 'string' } } }),
          responses: { 200: { description: 'Existing duplicate active tag returned', content: { 'application/json': { schema: { $ref: '#/components/schemas/Tag' } } } }, 201: { description: 'Tag created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Tag' } } } }, 400: r400, 401: r401, 409: r409 },
        },
      },

      '/tags/{id}': {
        parameters: [param('id', 'Tag ID')],
        patch: {
          tags: ['Tags'], summary: 'Update a tag (MANAGER+)', security: auth,
          requestBody: json({ type: 'object', properties: { name: { type: 'string' }, color: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] } } }),
          responses: { 200: { description: 'Updated tag', content: { 'application/json': { schema: { $ref: '#/components/schemas/Tag' } } } }, 400: r400, 401: r401, 403: r403, 404: r404, 409: r409 },
        },
        delete: {
          tags: ['Tags'], summary: 'Delete an unused tag (MANAGER+)', security: auth,
          responses: { 204: { description: 'Deleted' }, 401: r401, 403: r403, 404: r404, 409: r409 },
        },
      },

      '/tags/{id}/deactivate': {
        parameters: [param('id', 'Tag ID')],
        post: {
          tags: ['Tags'], summary: 'Deactivate a tag (MANAGER+)', security: auth,
          responses: { 200: { description: 'Deactivated tag', content: { 'application/json': { schema: { $ref: '#/components/schemas/Tag' } } } }, 401: r401, 403: r403, 404: r404 },
        },
      },

      // ─── Stats ───────────────────────────────────────────────────
      '/stats': {
        get: {
          tags: ['Stats'], summary: 'Get time tracking statistics (MANAGER+ only)', security: auth,
          responses: {
            200: { description: 'Aggregated stats (totals, daily breakdown, top projects)' },
            401: r401, 403: r403,
          },
        },
      },

      // ─── Insights ────────────────────────────────────────────────
      '/insights': {
        post: {
          tags: ['Insights'], summary: 'AI productivity insight (MANAGER+ only)', security: auth,
          requestBody: json({
            type: 'object', required: ['question', 'context'],
            properties: { question: { type: 'string', minLength: 1, maxLength: 500 }, context: { type: 'object' } },
          }),
          responses: {
            200: { description: 'AI answer', content: { 'application/json': { schema: { type: 'object', properties: { answer: { type: 'string' } } } } } },
            401: r401, 403: r403, 429: r429,
          },
        },
      },

      // ─── Organizations ───────────────────────────────────────────
      '/organizations': {
        get: {
          tags: ['Organizations'], summary: 'List organizations the current user belongs to', security: auth,
          responses: { 200: { description: 'Organizations list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Organization' } } } } }, 401: r401 },
        },
        post: {
          tags: ['Organizations'], summary: 'Create a new organization', security: auth,
          requestBody: json({
            type: 'object', required: ['name', 'slug'],
            properties: { name: { type: 'string', minLength: 1, maxLength: 100 }, slug: { type: 'string', minLength: 2, maxLength: 50 }, avatarUrl: { type: 'string', nullable: true } },
          }),
          responses: { 201: { description: 'Organization created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Organization' } } } }, 400: r400, 401: r401 },
        },
      },

      '/organizations/{orgId}': {
        parameters: [param('orgId', 'Organization ID')],
        get: {
          tags: ['Organizations'], summary: 'Get organization details', security: auth,
          responses: { 200: { description: 'Organization', content: { 'application/json': { schema: { $ref: '#/components/schemas/Organization' } } } }, 401: r401, 403: r403, 404: r404 },
        },
        patch: {
          tags: ['Organizations'], summary: 'Update organization (OWNER/ADMIN)', security: auth,
          requestBody: json({ type: 'object', properties: { name: { type: 'string' }, avatarUrl: { type: 'string', nullable: true } } }),
          responses: { 200: { description: 'Updated organization', content: { 'application/json': { schema: { $ref: '#/components/schemas/Organization' } } } }, 400: r400, 401: r401, 403: r403, 404: r404 },
        },
        delete: {
          tags: ['Organizations'], summary: 'Delete organization (OWNER only)', security: auth,
          responses: { 204: { description: 'Deleted' }, 401: r401, 403: r403, 404: r404 },
        },
      },

      '/organizations/{orgId}/switch': {
        parameters: [param('orgId', 'Organization ID')],
        post: {
          tags: ['Organizations'], summary: 'Switch active organization', security: auth,
          responses: { 200: { description: 'Active org updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }, 401: r401, 403: r403 },
        },
      },

      '/organizations/{orgId}/members': {
        parameters: [param('orgId', 'Organization ID')],
        get: {
          tags: ['Organizations'], summary: 'List organization members', security: auth,
          responses: { 200: { description: 'Members list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Membership' } } } } }, 401: r401, 403: r403 },
        },
      },

      '/organizations/{orgId}/members/{userId}': {
        parameters: [param('orgId', 'Organization ID'), param('userId', 'User ID')],
        patch: {
          tags: ['Organizations'], summary: 'Update member role (OWNER/ADMIN)', security: auth,
          requestBody: json({ type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'] } } }),
          responses: { 200: { description: 'Role updated' }, 400: r400, 401: r401, 403: r403, 404: r404 },
        },
        delete: {
          tags: ['Organizations'], summary: 'Remove member from organization', security: auth,
          responses: { 204: { description: 'Member removed' }, 401: r401, 403: r403, 404: r404 },
        },
      },

      // ─── Org Teams ───────────────────────────────────────────────
      '/organizations/{orgId}/teams': {
        parameters: [param('orgId', 'Organization ID')],
        get: {
          tags: ['Organizations'], summary: 'List teams in an organization', security: auth,
          responses: { 200: { description: 'Teams list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Team' } } } } }, 401: r401, 403: r403 },
        },
        post: {
          tags: ['Organizations'], summary: 'Create a team in an organization (MANAGER+)', security: auth,
          requestBody: json({ type: 'object', required: ['name'], properties: { name: { type: 'string' }, description: { type: 'string', nullable: true } } }),
          responses: { 201: { description: 'Team created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Team' } } } }, 400: r400, 401: r401, 403: r403 },
        },
      },

      '/organizations/{orgId}/teams/{teamId}': {
        parameters: [param('orgId', 'Organization ID'), param('teamId', 'Team ID')],
        get: {
          tags: ['Organizations'], summary: 'Get team details', security: auth,
          responses: { 200: { description: 'Team', content: { 'application/json': { schema: { $ref: '#/components/schemas/Team' } } } }, 401: r401, 403: r403, 404: r404 },
        },
        patch: {
          tags: ['Organizations'], summary: 'Update team (MANAGER+)', security: auth,
          requestBody: json({ type: 'object', properties: { name: { type: 'string' }, description: { type: 'string', nullable: true } } }),
          responses: { 200: { description: 'Updated team' }, 400: r400, 401: r401, 403: r403, 404: r404 },
        },
        delete: {
          tags: ['Organizations'], summary: 'Delete team (ADMIN+)', security: auth,
          responses: { 204: { description: 'Deleted' }, 401: r401, 403: r403, 404: r404 },
        },
      },

      '/organizations/{orgId}/teams/{teamId}/members': {
        parameters: [param('orgId', 'Organization ID'), param('teamId', 'Team ID')],
        post: {
          tags: ['Organizations'], summary: 'Add a member to a team (MANAGER+)', security: auth,
          requestBody: json({ type: 'object', required: ['userId'], properties: { userId: { type: 'string' } } }),
          responses: { 201: { description: 'Member added' }, 400: r400, 401: r401, 403: r403 },
        },
      },

      '/organizations/{orgId}/teams/{teamId}/members/{userId}': {
        parameters: [param('orgId'), param('teamId'), param('userId')],
        delete: {
          tags: ['Organizations'], summary: 'Remove a member from a team', security: auth,
          responses: { 204: { description: 'Member removed' }, 401: r401, 403: r403, 404: r404 },
        },
      },

      // ─── Org Invitations ─────────────────────────────────────────
      '/organizations/{orgId}/invitations': {
        parameters: [param('orgId', 'Organization ID')],
        get: {
          tags: ['Invitations'], summary: 'List pending invitations for an org (ADMIN+)', security: auth,
          responses: { 200: { description: 'Invitations list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Invitation' } } } } }, 401: r401, 403: r403 },
        },
        post: {
          tags: ['Invitations'], summary: 'Send an invitation (ADMIN+)', security: auth,
          requestBody: json({ type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' }, role: { type: 'string', default: 'MEMBER' } } }),
          responses: { 201: { description: 'Invitation created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Invitation' } } } }, 400: r400, 401: r401, 403: r403 },
        },
      },

      '/organizations/{orgId}/invitations/{inviteId}': {
        parameters: [param('orgId', 'Organization ID'), param('inviteId', 'Invitation ID')],
        delete: {
          tags: ['Invitations'], summary: 'Cancel / revoke an invitation (ADMIN+)', security: auth,
          responses: { 204: { description: 'Invitation cancelled' }, 401: r401, 403: r403, 404: r404 },
        },
      },

      '/invitations/{token}': {
        parameters: [param('token', 'Invitation token from email link')],
        get: {
          tags: ['Invitations'], summary: 'Get invitation details by token (public)', security: noAuth,
          responses: { 200: { description: 'Invitation info', content: { 'application/json': { schema: { $ref: '#/components/schemas/Invitation' } } } }, 404: r404 },
        },
      },

      '/invitations/{token}/accept': {
        parameters: [param('token', 'Invitation token')],
        post: {
          tags: ['Invitations'], summary: 'Accept an organization invitation', security: auth,
          responses: { 200: { description: 'Joined organization', content: { 'application/json': { schema: { $ref: '#/components/schemas/Membership' } } } }, 400: r400, 401: r401, 404: r404 },
        },
      },

      // ─── Admin — Users ───────────────────────────────────────────
      '/admin/users': {
        get: {
          tags: ['Admin'], summary: 'List all workspace users (ADMIN)', security: auth,
          responses: { 200: { description: 'Users', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } }, 401: r401, 403: r403 },
        },
        post: {
          tags: ['Admin'], summary: 'Create a user directly (ADMIN)', security: auth,
          requestBody: json({
            type: 'object', required: ['name', 'email', 'role'],
            properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 }, role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'] } },
          }),
          responses: { 201: { description: 'User created', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }, 400: r400, 401: r401, 403: r403 },
        },
      },

      '/admin/users/{id}': {
        parameters: [param('id', 'User ID')],
        patch: {
          tags: ['Admin'], summary: 'Update user role or details (ADMIN)', security: auth,
          requestBody: json({ type: 'object', properties: { name: { type: 'string' }, role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'] } } }),
          responses: { 200: { description: 'Updated user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }, 400: r400, 401: r401, 403: r403, 404: r404 },
        },
        delete: {
          tags: ['Admin'], summary: 'Delete a user (ADMIN)', security: auth,
          responses: { 204: { description: 'User deleted' }, 401: r401, 403: r403, 404: r404 },
        },
      },

      // ─── Admin — Teams ───────────────────────────────────────────
      '/admin/teams': {
        get: {
          tags: ['Admin'], summary: 'List all teams (ADMIN)', security: auth,
          responses: { 200: { description: 'Teams', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Team' } } } } }, 401: r401, 403: r403 },
        },
        post: {
          tags: ['Admin'], summary: 'Create a team (ADMIN)', security: auth,
          requestBody: json({ type: 'object', required: ['name'], properties: { name: { type: 'string' }, description: { type: 'string', nullable: true } } }),
          responses: { 201: { description: 'Team created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Team' } } } }, 400: r400, 401: r401, 403: r403 },
        },
      },

      '/admin/teams/{id}': {
        parameters: [param('id', 'Team ID')],
        patch: {
          tags: ['Admin'], summary: 'Update a team (ADMIN)', security: auth,
          requestBody: json({ type: 'object', properties: { name: { type: 'string' }, description: { type: 'string', nullable: true } } }),
          responses: { 200: { description: 'Updated team', content: { 'application/json': { schema: { $ref: '#/components/schemas/Team' } } } }, 400: r400, 401: r401, 403: r403, 404: r404 },
        },
        delete: {
          tags: ['Admin'], summary: 'Delete a team (ADMIN)', security: auth,
          responses: { 204: { description: 'Team deleted' }, 401: r401, 403: r403, 404: r404 },
        },
      },

      '/admin/teams/{id}/members': {
        parameters: [param('id', 'Team ID')],
        post: {
          tags: ['Admin'], summary: 'Add user to team (ADMIN)', security: auth,
          requestBody: json({ type: 'object', required: ['userId'], properties: { userId: { type: 'string' }, memberRole: { type: 'string', enum: ['MANAGER', 'MEMBER'], default: 'MEMBER' } } }),
          responses: { 200: { description: 'Member upserted', content: { 'application/json': { schema: { $ref: '#/components/schemas/TeamMember' } } } }, 400: r400, 401: r401, 403: r403 },
        },
        delete: {
          tags: ['Admin'], summary: 'Remove user from team (ADMIN)', security: auth,
          parameters: [{ name: 'userId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { 204: { description: 'Member removed' }, 401: r401, 403: r403, 404: r404 },
        },
      },

      // ─── Admin — Clients ─────────────────────────────────────────
      '/admin/clients': {
        get: {
          tags: ['Admin'], summary: 'List all clients (ADMIN)', security: auth,
          responses: { 200: { description: 'Clients', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Client' } } } } }, 401: r401, 403: r403 },
        },
        post: {
          tags: ['Admin'], summary: 'Create a client (ADMIN)', security: auth,
          requestBody: json({ type: 'object', required: ['name'], properties: { name: { type: 'string' }, description: { type: 'string', nullable: true } } }),
          responses: { 201: { description: 'Client created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } }, 400: r400, 401: r401, 403: r403 },
        },
      },

      '/admin/clients/{id}': {
        parameters: [param('id', 'Client ID')],
        patch: {
          tags: ['Admin'], summary: 'Update a client (ADMIN)', security: auth,
          requestBody: json({ type: 'object', properties: { name: { type: 'string' }, description: { type: 'string', nullable: true } } }),
          responses: { 200: { description: 'Updated client', content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } }, 400: r400, 401: r401, 403: r403, 404: r404 },
        },
        delete: {
          tags: ['Admin'], summary: 'Delete a client (ADMIN)', security: auth,
          responses: { 204: { description: 'Client deleted' }, 401: r401, 403: r403, 404: r404 },
        },
      },

      '/admin/clients/{id}/assignments': {
        parameters: [param('id', 'Client ID')],
        post: {
          tags: ['Admin'], summary: 'Assign client to a user or team (ADMIN)', security: auth,
          requestBody: json({ type: 'object', properties: { userId: { type: 'string', nullable: true }, teamId: { type: 'string', nullable: true }, accessLevel: { type: 'string', enum: ['VIEW', 'MANAGE', 'REPORT'] } } }),
          responses: { 200: { description: 'Assignment upserted' }, 400: r400, 401: r401, 403: r403 },
        },
      },

      '/admin/projects/{id}/assignments': {
        parameters: [param('id', 'Project ID')],
        post: {
          tags: ['Admin'], summary: 'Assign project to a user or team (ADMIN)', security: auth,
          requestBody: json({ type: 'object', properties: { userId: { type: 'string', nullable: true }, teamId: { type: 'string', nullable: true }, accessLevel: { type: 'string', enum: ['VIEW', 'TRACK', 'MANAGE', 'APPROVE'] } } }),
          responses: { 200: { description: 'Assignment upserted' }, 400: r400, 401: r401, 403: r403 },
        },
      },

      // ─── Admin — Invites ─────────────────────────────────────────
      '/admin/invites': {
        post: {
          tags: ['Admin'], summary: 'Send a workspace invite email (ADMIN)', security: auth,
          requestBody: json({ type: 'object', required: ['email', 'role'], properties: { email: { type: 'string', format: 'email' }, role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'] } } }),
          responses: {
            200: { description: 'Invite sent. Link logged to console.', content: { 'application/json': { schema: { type: 'object', properties: { inviteUrl: { type: 'string' }, email: { type: 'string' }, role: { type: 'string' } } } } } },
            400: r400, 401: r401, 403: r403,
          },
        },
      },

    },
  }
}
