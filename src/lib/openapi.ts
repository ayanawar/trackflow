export function getOpenAPISpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'TrackFlow API',
      version: '1.0.0',
      description: 'Time tracking application API. Authentication uses httpOnly cookies (`tf_token` access token, `tf_refresh` refresh token). Most endpoints require an active session.',
    },
    servers: [{ url: '/api', description: 'Current server' }],
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
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            workspace: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
            dailyHoursGoal: { type: 'integer', minimum: 1, maximum: 24 },
            avatarUrl: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Team: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            createdById: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Client: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            createdById: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ProjectAssignment: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            userId: { type: 'string', nullable: true },
            teamId: { type: 'string', nullable: true },
            accessLevel: { type: 'string', enum: ['VIEW', 'TRACK', 'MANAGE', 'APPROVE'] },
          },
        },
        ClientAssignment: {
          type: 'object',
          properties: {
            clientId: { type: 'string' },
            userId: { type: 'string', nullable: true },
            teamId: { type: 'string', nullable: true },
            accessLevel: { type: 'string', enum: ['VIEW', 'MANAGE', 'REPORT'] },
          },
        },
        SecurityEvent: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            userId: { type: 'string', nullable: true },
            email: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new account',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', minLength: 1, maxLength: 100 },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    workspace: { type: 'string', default: 'My Workspace' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Account created. Sets tf_token (15 min) and tf_refresh (30 day) httpOnly cookies.',
              content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } } } } },
            },
            400: { description: 'Validation error or email already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email and password',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful. Sets tf_token and tf_refresh cookies.', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } } } } } },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            429: { description: 'Rate limit exceeded (10 req / 15 min per IP)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout — revokes refresh token and clears cookies',
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: 'Always 200 (idempotent). Clears tf_token and tf_refresh cookies.', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Exchange refresh token for a new access token',
          security: [],
          description: 'Reads tf_refresh cookie. Rotates the refresh token (family-based). Reuse of a rotated token invalidates the entire session.',
          responses: {
            200: { description: 'New access token issued. Sets new tf_token (15 min) and rotated tf_refresh (30 day) cookies.', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' } } } } } },
            401: { description: 'Invalid, expired, or reused refresh token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request a password reset token',
          security: [],
          description: 'Always returns 200 to prevent email enumeration. Reset token is logged to server console (email delivery is a future enhancement).',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } },
          },
          responses: {
            200: { description: 'Always 200 regardless of whether email exists.', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
            429: { description: 'Rate limit exceeded (5 req / hour per IP)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password using a one-time token',
          security: [],
          description: 'Consumes the one-time token (1-hour expiry). Invalidates all existing sessions after reset.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token', 'password'],
                  properties: {
                    token: { type: 'string', description: 'Raw token from server console or email' },
                    password: { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Password updated. All existing sessions revoked.', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
            400: { description: 'Invalid, expired, or already-used token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get the current authenticated user',
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: 'Current user profile including role', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        patch: {
          tags: ['Auth'],
          summary: 'Update current user profile',
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 1, maxLength: 100 },
                    workspace: { type: 'string', minLength: 1, maxLength: 100 },
                    dailyHoursGoal: { type: 'integer', minimum: 1, maximum: 24 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Updated user profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/google': {
        post: {
          tags: ['Auth'],
          summary: 'Authenticate with a Google OAuth ID token',
          security: [],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['idToken'], properties: { idToken: { type: 'string' } } } } },
          },
          responses: {
            200: { description: 'Google login successful. Sets tf_token and tf_refresh cookies.', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } } } } } },
            400: { description: 'Email already registered with password account', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            401: { description: 'Invalid Google token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/stats': {
        get: {
          tags: ['Stats'],
          summary: 'Get time tracking statistics',
          description: '**Role required**: MANAGER or ADMIN. Employees receive 403.',
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: 'Statistics for the current user' },
            401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Forbidden — EMPLOYEE role', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/insights': {
        post: {
          tags: ['Insights'],
          summary: 'Query AI insights about time data',
          description: '**Role required**: MANAGER or ADMIN. Employees receive 403.',
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['question', 'context'],
                  properties: {
                    question: { type: 'string', minLength: 1, maxLength: 500 },
                    context: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'AI answer', content: { 'application/json': { schema: { type: 'object', properties: { answer: { type: 'string' } } } } } },
            401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Forbidden — EMPLOYEE role', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            429: { description: 'Rate limit exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/admin/users': {
        get: {
          tags: ['Admin'],
          summary: 'List all workspace users',
          description: '**Role required**: ADMIN only. Managers and Employees receive 403.',
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: 'List of all users', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } },
            401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Forbidden — not ADMIN', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/admin/teams': {
        get: {
          tags: ['Admin'],
          summary: 'List teams',
          description: '**Role required**: ADMIN only.',
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: 'Teams', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Team' } } } } },
            401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        post: {
          tags: ['Admin'],
          summary: 'Create team',
          description: '**Role required**: ADMIN only.',
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, description: { type: 'string', nullable: true } } } } },
          },
          responses: {
            201: { description: 'Team created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Team' } } } },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/admin/clients': {
        get: {
          tags: ['Admin'],
          summary: 'List clients',
          description: '**Role required**: ADMIN only.',
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: 'Clients', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Client' } } } } },
            401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        post: {
          tags: ['Admin'],
          summary: 'Create client',
          description: '**Role required**: ADMIN only.',
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, description: { type: 'string', nullable: true } } } } },
          },
          responses: {
            201: { description: 'Client created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/admin/projects/{id}/assignments': {
        post: {
          tags: ['Admin'],
          summary: 'Assign a project to a user or team',
          description: '**Role required**: ADMIN only. Provide exactly one of userId or teamId.',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ProjectAssignment' } } },
          },
          responses: {
            200: { description: 'Assignment upserted' },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/admin/clients/{id}/assignments': {
        post: {
          tags: ['Admin'],
          summary: 'Assign a client to a user or team',
          description: '**Role required**: ADMIN only. Provide exactly one of userId or teamId.',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientAssignment' } } },
          },
          responses: {
            200: { description: 'Assignment upserted' },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
    },
  }
}
