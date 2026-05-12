# Data Model: Clean Code Architecture Refactor

**Branch**: `003-clean-code-arch` | **Date**: 2026-05-13

> No Prisma schema changes are introduced by this refactor. This document describes the **architectural data model** — the layering entities, their responsibilities, and the data contracts between layers.

---

## Prisma Schema (unchanged)

```
User (id, name, email, password, workspace, createdAt, updatedAt)
  └─── Project[] (id, name, client?, color, userId, createdAt, updatedAt)
  └─── TimeEntry[] (id, description?, projectId?, tagId?, startTime, endTime?, duration?, isRunning, userId, createdAt)
  └─── Tag[] (id, name, color, userId, createdAt)  @@unique([name, userId])
```

---

## Architectural Layers

### Repository Layer (`src/repositories/`)

Each repository file wraps Prisma calls for a single model. Repositories:
- Accept typed plain-object arguments
- Return typed plain objects (Prisma model types or mapped DTOs)
- Are stateless — no business logic, no auth checks
- Import only `prisma` from `src/lib/prisma.ts`

| File | Responsibility | Key Operations |
|---|---|---|
| `user.repository.ts` | User CRUD | `findByEmail`, `findById`, `create`, `update` |
| `project.repository.ts` | Project CRUD + aggregation | `findAllByUser`, `findById`, `create`, `update`, `delete` |
| `timeEntry.repository.ts` | TimeEntry CRUD + running-entry logic | `findAllByUser`, `findById`, `findRunning`, `create`, `update`, `stopRunning`, `delete` |
| `tag.repository.ts` | Tag upsert + list | `findAllByUser`, `upsertByName`, `findById`, `delete` |

### Service Layer (`src/services/`)

Each service file orchestrates business rules using one or more repositories. Services:
- Accept typed plain-object arguments
- Contain all business logic (e.g., stop running entry before creating new one)
- Call repositories — never call Prisma directly
- Are async functions — no class instances required

| File | Responsibility | Key Operations |
|---|---|---|
| `auth.service.ts` | Auth flows | `register`, `login`, `getMe`, `updateMe` |
| `project.service.ts` | Project management | `createProject`, `updateProject`, `deleteProject`, `listProjects` |
| `timeEntry.service.ts` | Time tracking | `createEntry` (stops running first), `stopEntry`, `updateEntry`, `deleteEntry`, `listEntries` |
| `stats.service.ts` | Aggregated stats + caching | `getStats` (30s TTL per userId), `invalidateStatsCache` |
| `insights.service.ts` | AI proxy + rate limiting | `askAI` (enforces 10 req/min, calls Anthropic, returns text) |

### Hook Layer (`src/hooks/`)

Custom React Query hooks consumed by pages/components. Hooks:
- Export a single named function per resource action
- Define `queryKey` constants (e.g., `PROJECTS_KEY = ['projects']`)
- Handle cache invalidation in `onSuccess` callbacks
- Never import `apiClient` directly — route through shared `api` instance

| File | Exports |
|---|---|
| `useProjects.ts` | `useProjects()`, `useCreateProject()`, `useUpdateProject()`, `useDeleteProject()` |
| `useTimeEntries.ts` | `useTimeEntries(limit?)`, `useCreateEntry()`, `useStopEntry()`, `useUpdateEntry()`, `useDeleteEntry()` |
| `useStats.ts` | `useStats()` |
| `useTags.ts` | `useTags()` |

---

## Data Flow

```
Browser Component
  └── calls useProjects() / useCreateEntry() / etc.
         └── React Query → apiClient (Axios, /api/*)
               └── Route Handler (thin: parse → call service → return)
                     └── Service (business rules)
                           └── Repository (Prisma calls)
                                 └── PostgreSQL
```

---

## Rate Limit State (`src/lib/rateLimit.ts`)

```
rateLimitStore: Map<userId: string, timestamps: number[]>
```

- Timestamps represent the Unix millisecond time of each request
- On each request: filter out timestamps older than 60 000ms, count remaining
- If count ≥ 10: reject with 429
- If count < 10: append current timestamp and allow

This state is module-level (in-memory). It resets on server restart and is not shared across server instances.

---

## Stats Cache State (`src/services/stats.service.ts`)

```
statsCache: Map<userId: string, { data: Stats; expiresAt: number }>
```

- `expiresAt` = `Date.now() + 30_000`
- `invalidateStatsCache(userId)` deletes the entry
- Called from `timeEntry.service.ts` after any create/stop/update/delete operation

---

## New API Endpoint

### `POST /api/insights`

**Request**:
```json
{ "question": "string (1–500 chars)" }
```

**Response 200**:
```json
{ "answer": "string" }
```

**Response 400**: `{ "error": "Question is required" }`
**Response 429**: `{ "error": "Too many requests. Please wait before asking again." }`
**Response 503**: `{ "error": "AI is unavailable, please try again." }`
