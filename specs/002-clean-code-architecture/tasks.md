# Tasks: Clean Code Architecture Refactor

**Input**: Design documents from `specs/002-clean-code-architecture/`
**Branch**: `003-clean-code-arch`
**Prerequisites**: plan.md ✓ spec.md ✓ research.md ✓ data-model.md ✓ contracts/ ✓ quickstart.md ✓

**Tests**: Smoke tests only (no test runner configured — see quickstart.md verification commands).

**User Stories**:
- US1 (P1): Security vulnerabilities eliminated
- US2 (P2): Service & repository layer separation
- US3 (P2): Shared custom hooks
- US4 (P3): Type safety & schema consistency
- US5 (P3): Stats query consolidation
- US6 (P3): Tag input UX replacement

---

## Phase 1: Setup

**Purpose**: Create new directory structure required by the refactored architecture.

- [x] T001 Create `src/repositories/` directory
- [x] T002 [P] Create `src/services/` directory
- [x] T003 [P] Create `src/hooks/` directory
- [x] T004 [P] Create `src/components/ui/` directory

**Checkpoint**: Directories exist; project still builds with no changes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that every user story depends on. Nothing in Phase 3+ can be wired up until this phase is complete.

**⚠️ CRITICAL**: No user story implementation work begins until this phase is complete.

### 2a — Library & Utility Updates

- [x] T005 Add `JWT_SECRET` startup guard in `src/lib/auth.ts`: remove `|| 'trackflow-secret-key-change-in-production'` fallback; throw `Error` in production and `console.warn` in development if secret is absent or matches the known-insecure default
- [x] T006 [P] Move inline `updateSchema` from `src/app/api/auth/me/route.ts` to `src/lib/schemas.ts` as `updateUserSchema`; add `aiQuerySchema = z.object({ question: z.string().min(1).max(500), context: z.object({}).passthrough() })` to `src/lib/schemas.ts`
- [x] T007 [P] Create `src/lib/rateLimit.ts`: implement `checkRateLimit(userId: string, limit: number, windowMs: number): { allowed: boolean }` using a module-level `Map<string, number[]>` sliding window
- [x] T008 [P] Update `src/lib/authStore.ts`: remove `window.location.href = '/auth/login'` from the `logout` action; `logout` only calls `POST /api/auth/logout` and clears user state
- [x] T009 [P] Remove hardcoded demo credentials `<div>` from `src/app/auth/login/page.tsx`

### 2b — Repository Layer (4 new files, not yet called by any route)

- [x] T010 Create `src/repositories/user.repository.ts` with functions: `findByEmail(email)`, `findById(id)`, `createUser(data)`, `updateUser(id, data)` — all Prisma calls, no business logic
- [x] T011 [P] Create `src/repositories/project.repository.ts` with functions: `findAllByUser(userId)` (includes `_count` and `timeEntries` aggregation for `totalSeconds`/`entryCount`), `findProjectById(id, userId)`, `createProject(data)`, `updateProject(id, userId, data)`, `deleteProject(id, userId)`
- [x] T012 [P] Create `src/repositories/timeEntry.repository.ts` with functions: `findAllByUser(userId, limit)`, `findEntryById(id, userId)`, `findRunning(userId)`, `createEntry(data)`, `updateEntry(id, userId, data)`, `stopRunning(userId, endTime)` (updates all `isRunning=true` entries), `stopOne(id, userId, endTime)`, `deleteEntry(id, userId)`
- [x] T013 [P] Create `src/repositories/tag.repository.ts` with functions: `findAllByUser(userId)`, `upsertByName(name, userId)`, `findTagById(id, userId)`, `deleteTag(id, userId)`

### 2c — Service Layer (5 new files, not yet called by any route)

- [x] T014 Create `src/services/auth.service.ts` with functions: `register(data)` (hash password via bcryptjs, call `createUser`, return user), `login(email, password)` (find user via `findByEmail`, verify bcrypt hash, return user or throw), `getMe(userId)` (call `findById`), `updateMe(userId, data)` (call `updateUser`) — imports only from `user.repository`
- [x] T015 [P] Create `src/services/project.service.ts` with functions: `listProjects(userId)`, `createProject(userId, data)`, `updateProject(id, userId, data)`, `deleteProject(id, userId)` — imports from `project.repository`
- [x] T016 [P] Create `src/services/timeEntry.service.ts` with functions: `listEntries(userId, limit)`, `createEntry(userId, data)` (calls `stopRunning` first, upserts tag, creates entry, calls `invalidateStatsCache(userId)`), `stopEntry(id, userId, endTime)` (idempotent: return entry as-is if already stopped), `updateEntry(id, userId, data)` (calls `invalidateStatsCache`), `deleteEntry(id, userId)` (calls `invalidateStatsCache`) — imports from `timeEntry.repository`, `tag.repository`, `stats.service`
- [x] T017 [P] Create `src/services/stats.service.ts` with: module-level `statsCache: Map<string, { data: Stats; expiresAt: number }>`, `getStats(userId)` (return cache if not expired, else query DB with ≤4 Prisma calls, cache with 30s TTL), exported `invalidateStatsCache(userId)` (delete cache entry)
- [x] T018 [P] Create `src/services/insights.service.ts` with function `askAI(userId, question, context)`: call `checkRateLimit(userId, 10, 60000)`, throw `RateLimitError` if denied; call Anthropic API using `ANTHROPIC_API_KEY`; return `{ answer: string }`; catch all Anthropic errors and throw `ServiceUnavailableError` (never expose raw error to caller)

**Checkpoint**: All repositories and services exist and are type-checkable in isolation. No routes have changed yet. Run `npx tsc --noEmit` — should pass.

---

## Phase 3: User Story 1 — Security Vulnerabilities Eliminated (Priority: P1) 🎯 MVP

**Goal**: Eliminate all active security vulnerabilities: direct browser-to-Anthropic API calls, `dangerouslySetInnerHTML` XSS vector, and hardcoded JWT secret fallback.

**Independent Test**: (1) Open Insights page, ask a question — inspect network tab and confirm zero requests to `api.anthropic.com`. (2) View rendered AI response — confirm no raw HTML injection. (3) Remove `JWT_SECRET` from `.env.local` and restart — confirm server warns/throws rather than silently using the insecure default.

- [x] T019 [US1] Create `src/app/api/insights/route.ts`: authenticate session → validate body with `aiQuerySchema` → call `insights.service.askAI` → return `ok({ answer })` on success; return `unauthorized()` if no session; return `badRequest()` on invalid input; return `NextResponse.json({ error: 'Too many requests. Please wait before asking again.' }, { status: 429, headers: { 'Retry-After': '60' } })` on `RateLimitError`; return `NextResponse.json({ error: 'AI is unavailable, please try again.' }, { status: 503 })` on `ServiceUnavailableError`
- [x] T020 [P] [US1] Create `src/components/ui/SafeMarkdown.tsx`: React component accepting `text: string` prop — splits on `**...**` boundaries to produce `<strong>` elements, replaces `\n` with `<br />`, all other text as plain React text nodes; zero `dangerouslySetInnerHTML`
- [x] T021 [US1] Update `src/app/insights/page.tsx`: replace `fetch('https://api.anthropic.com/...')` with `api.post('/insights', { question, context })` where context is an object `{ todaySeconds, weekSeconds, monthSeconds, totalEntries, projects, recentEntries }`; replace `dangerouslySetInnerHTML` with `<SafeMarkdown text={response} />`; show user-friendly "Too many requests" message on 429; show "AI is unavailable, please try again." on non-2xx
- [x] T022 [US1] Verify T005 is active: confirm `src/lib/auth.ts` has no hardcoded fallback string and guard code is in place

**Checkpoint**: `grep -r "api.anthropic.com" src/app/` → no matches. `grep -r "dangerouslySetInnerHTML" src/` → no matches. Ask a question on Insights page and confirm the network tab shows `POST /api/insights`.

---

## Phase 4: User Story 2 — Service & Repository Layer Separation (Priority: P2)

**Goal**: All 11 existing route handlers delegate to services; no Prisma calls remain in any route file.

**Independent Test**: `grep -r "prisma\." src/app/api/` → zero matches. `grep -r "from '@prisma/client'" src/app/api/` → zero matches. All existing API endpoints return identical responses to before.

### Auth Routes

- [x] T023 [US2] Rewrite `src/app/api/auth/login/route.ts`: validate with `loginSchema` → call `auth.service.login` → call `signToken` + `setTokenCookie` → return `ok({ user, token })`. No Prisma or bcrypt imports.
- [x] T024 [P] [US2] Rewrite `src/app/api/auth/register/route.ts`: validate with `registerSchema` → call `auth.service.register` → call `signToken` + `setTokenCookie` → return `created({ user, token })`. No Prisma or bcrypt imports.
- [x] T025 [P] [US2] Rewrite `src/app/api/auth/me/route.ts`: GET → call `auth.service.getMe`; PATCH → validate with `updateUserSchema` (imported from `src/lib/schemas.ts`) → call `auth.service.updateMe`. No Prisma imports, no inline schema.

### Project Routes

- [x] T026 [P] [US2] Rewrite `src/app/api/projects/route.ts`: GET → call `project.service.listProjects`; POST → validate with `projectSchema` → call `project.service.createProject`. No Prisma imports.
- [x] T027 [P] [US2] Rewrite `src/app/api/projects/[id]/route.ts`: GET → call `project.service.findById`; PUT → validate with `projectSchema.partial()` → call `project.service.updateProject`; DELETE → call `project.service.deleteProject`. No Prisma imports.

### Time Entry Routes

- [x] T028 [US2] Rewrite `src/app/api/time-entries/route.ts`: GET → call `timeEntry.service.listEntries`; POST → validate with `timeEntrySchema` → call `timeEntry.service.createEntry` (service handles stopping running entry and tag upsert). No Prisma imports.
- [x] T029 [P] [US2] Rewrite `src/app/api/time-entries/[id]/route.ts`: GET → `timeEntry.service.getEntry`; PUT → validate with `timeEntryUpdateSchema` → call `timeEntry.service.updateEntry`; DELETE → call `timeEntry.service.deleteEntry`. No Prisma imports.
- [x] T030 [P] [US2] Rewrite `src/app/api/time-entries/[id]/stop/route.ts`: parse optional `endTime` from body → call `timeEntry.service.stopEntry` (idempotent — returns entry as-is if already stopped). No Prisma imports.

### Stats & Tags Routes

- [x] T031 [P] [US2] Rewrite `src/app/api/stats/route.ts`: GET → call `stats.service.getStats`. Single service call; no Prisma imports; no inline aggregation logic.
- [x] T032 [P] [US2] Rewrite `src/app/api/tags/route.ts` and `src/app/api/tags/[id]/route.ts`: GET → `tag.repository.findAllByUser`; POST → `tag.repository.upsertByName`; DELETE → `tag.repository.deleteTag`. No Prisma imports in route files.

**Checkpoint**: `grep -r "prisma\." src/app/api/` → zero results. `grep -r "z\.object" src/app/api/` → zero results. Smoke test all endpoints.

---

## Phase 5: User Story 3 — Shared Custom Hooks (Priority: P2)

**Goal**: All data-fetching in pages uses shared hooks from `src/hooks/`; no page directly imports `apiClient` for data queries.

**Independent Test**: `grep -r "useQuery" src/app/` → zero results. `grep -r "useMutation" src/app/` → zero results. All pages render correctly.

### Create Hook Files

- [x] T033 [US3] Create `src/hooks/useProjects.ts`: export `PROJECTS_KEY`, `useProjects()`, `useCreateProject()`, `useUpdateProject()`, `useDeleteProject()` — each mutation invalidates `PROJECTS_KEY` on success
- [x] T034 [P] [US3] Create `src/hooks/useTimeEntries.ts`: export `TIME_ENTRIES_KEY`, `useTimeEntries(limit?)`, `useCreateEntry()`, `useStopEntry()`, `useUpdateEntry()`, `useDeleteEntry()` — mutations invalidate `TIME_ENTRIES_KEY` and `STATS_KEY`
- [x] T035 [P] [US3] Create `src/hooks/useStats.ts`: export `STATS_KEY`, `useStats()` with `refetchInterval: 15000`
- [x] T036 [P] [US3] Create `src/hooks/useTags.ts`: export `TAGS_KEY`, `useTags()`, `useDeleteTag()`

### Update Pages & Components

- [x] T037 [US3] Update `src/app/tracker/page.tsx`: replace inline `useQuery`/`useMutation` calls with `useTimeEntries()`, `useProjects()`, `useCreateEntry()`, `useStopEntry()`, `useUpdateEntry()`, `useDeleteEntry()`
- [x] T038 [P] [US3] Update `src/app/dashboard/page.tsx`: replace inline `useQuery` calls with `useStats()`, `useProjects()`
- [x] T039 [P] [US3] Update `src/app/projects/page.tsx`: replace inline `useQuery` + `useMutation` with `useProjects()`, `useCreateProject()`, `useUpdateProject()`, `useDeleteProject()`
- [x] T040 [P] [US3] Update `src/app/insights/page.tsx`: replace inline `useQuery` calls for entries/stats/projects with `useTimeEntries()`, `useStats()`, `useProjects()`
- [x] T041 [US3] Update logout call sites in `src/components/layout/Sidebar.tsx`: after `await logout()` call add `router.push('/auth/login')` for both desktop and mobile logout buttons (since `logout` no longer navigates)

**Checkpoint**: `grep -r "from '@/lib/apiClient'" src/app/` → zero results (apiClient import only in hooks). All pages load and data renders correctly.

---

## Phase 6: User Story 4 — Type Safety & Schema Consistency (Priority: P3)

**Goal**: Zero TypeScript errors; no inline Zod schemas in route files; all schemas imported from `src/lib/schemas.ts`.

**Independent Test**: `npx tsc --noEmit` exits with code 0. `grep -r "z\.object" src/app/api/` → zero matches.

- [x] T042 [US4] Verify `src/lib/schemas.ts` contains `updateUserSchema` (moved from `me/route.ts`) and `aiQuerySchema`; update any remaining import references in route files if not already done in Phase 4
- [x] T043 [US4] Run `npx tsc --noEmit` and fix all remaining type errors; document each non-obvious fix with a brief inline comment

**Checkpoint**: `npx tsc --noEmit` exits 0. `grep -r "z\.object" src/app/api/` → zero results.

---

## Phase 7: User Story 5 — Stats Query Consolidation (Priority: P3)

**Goal**: `GET /api/stats` executes ≤4 DB queries; repeated calls within 30s hit cache with zero additional queries.

**Independent Test**: Enable Prisma query logging (`log: ['query']` in `new PrismaClient()`), call `GET /api/stats`, count logged queries — must be ≤4. Call again within 30s — zero queries logged.

- [x] T044 [US5] Verify `src/services/stats.service.ts` implements ≤4 Prisma calls: consolidate today/week/month windows using a single query with `OR` date conditions, use `count` for total entries, use one `findMany` for projects with `timeEntries` aggregation, use one `groupBy` for 7 daily totals. Refactor if current implementation exceeds 4 queries.
- [x] T045 [P] [US5] Verify `invalidateStatsCache(userId)` is called from `timeEntry.service.ts` after every mutation (create, stop, update, delete) so cache never serves stale data

**Checkpoint**: Log Prisma queries during a `GET /api/stats` call — confirm ≤4. Start and stop a timer — confirm next stats call refreshes correctly.

---

## Phase 8: User Story 6 — Tag Input UX Replacement (Priority: P3)

**Goal**: Replace the `prompt()` call in `TimerBar.tsx` with an inline tag picker showing existing tags and allowing free-text entry.

**Independent Test**: Click the Tag button in the TimerBar → no browser `prompt()` dialog appears → a styled in-app popover opens → selecting a tag or typing one sets it and closes the picker.

- [x] T046 [US6] Create `src/components/tracker/TagInput.tsx`: popover anchored to trigger button; renders `useTags()` results as clickable suggestion buttons; includes text input at top for free-text entry; pressing Enter or clicking a suggestion calls `onSelect(tagName: string)` and closes; clicking outside closes without selecting; accepts `value: string` and `onSelect: (tag: string) => void` props
- [x] T047 [US6] Update `src/components/tracker/TimerBar.tsx`: import `TagInput`; replace the `onClick={() => { const t = prompt(...); if (t !== null) setTag(t) }}` button with `<TagInput value={tag} onSelect={setTag} />`; remove the `prompt()` call entirely

**Checkpoint**: `grep -r "prompt(" src/` → zero results. Open app → click Tag button → no dialog → styled picker → select tag → tag shown in TimerBar.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, cleanup, and documentation.

- [x] T048 Run all architecture verification commands from `quickstart.md` and fix any remaining violations:
  - `grep -r "api.anthropic.com" src/app/` → must be zero
  - `grep -r "dangerouslySetInnerHTML" src/` → must be zero
  - `grep -r "prisma\." src/app/api/` → must be zero
  - `grep -r "z\.object" src/app/api/` → must be zero
  - `grep -r "prompt(" src/` → must be zero
  - `npx tsc --noEmit` → exit code 0
- [x] T049 [P] Smoke test all primary user flows: register → login → start timer → stop timer → add manual entry → edit entry → delete entry → create project → view dashboard → open AI insights → ask question → verify proxy response → verify rate limit message on 11th request
- [x] T050 Update `specs/002-clean-code-architecture/checklists/requirements.md`: mark SC-001 through SC-010 as verified with evidence from the verification commands above

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** (Setup): No dependencies — start immediately
- **Phase 2** (Foundational): Depends on Phase 1 — **BLOCKS all user story phases**
- **Phase 3** (US1 Security): Depends on Phase 2 (needs `insights.service.ts` T018, `aiQuerySchema` T006, JWT guard T005)
- **Phase 4** (US2 Routes): Depends on Phase 2 (needs all repositories and services)
- **Phase 5** (US3 Hooks): Depends on Phase 4 (hooks wrap existing endpoints; authStore change in T008)
- **Phase 6** (US4 Types): Depends on Phases 3–4 (schemas moved, routes rewritten)
- **Phase 7** (US5 Stats): Depends on Phase 4 (stats route wired to service in T031)
- **Phase 8** (US6 TagInput): Depends on Phase 5 (`useTags` hook available from T036)
- **Phase 9** (Polish): Depends on all prior phases

### User Story Dependencies

- **US1 (P1)**: Unblocked after Phase 2 — can deliver security fixes independently
- **US2 (P2)**: Unblocked after Phase 2 — no dependency on US1
- **US3 (P2)**: Depends on US2 (hooks wrap endpoints rewritten in Phase 4)
- **US4 (P3)**: Covered by Phases 2+4; verification tasks only
- **US5 (P3)**: Covered by Phase 2 (stats.service T017) + Phase 4 (route wiring T031); verification tasks only
- **US6 (P3)**: Depends on Phase 5 (`useTags` hook from T036 needed by TagInput)

### Parallel Opportunities Per Phase

```
Phase 2a parallel group (T006, T007, T008, T009): all modify different lib/ files
Phase 2b parallel group (T011, T012, T013): three different repository files
Phase 2c parallel group (T015, T016, T017, T018): four different service files

Phase 3 parallel (T020): SafeMarkdown can be written while insights route (T019) is being built

Phase 4 parallel group (T024–T032): each modifies a different route file

Phase 5 parallel group A (T034, T035, T036): three different hook files
Phase 5 parallel group B (T038, T039, T040): three different page files
```

---

## Implementation Strategy

### MVP (US1 Security Fixes Only)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 tasks T005–T007 and T018 only (JWT guard + schemas + rate limiter + insights service)
3. Complete Phase 3 (US1: insights proxy route, SafeMarkdown, page update)
4. **STOP and VALIDATE**: Confirm no browser-to-Anthropic calls, no XSS, JWT guard active
5. This delivers the highest-priority security fix without requiring the full architecture refactor

### Recommended Full Order

Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phases 6+7+8 in parallel → Phase 9

### Parallel Team Strategy

With two developers:
- **Dev A**: Phase 2 tasks T005–T009, T010–T013 (foundation + repositories)
- **Dev B**: Phase 2 tasks T014–T018 (services) — start once T010-T013 are complete
- After Phase 2: Dev A takes Phase 3+5; Dev B takes Phase 4+6+7+8

---

## Notes

- `[P]` tasks modify different files — safe to run in parallel
- `[Story]` label maps each task to its user story for traceability
- No test runner configured; use `npx tsc --noEmit` + `grep` + browser smoke tests
- Commit after each phase checkpoint passes
- The MVP path (US1 only) can ship independently without completing Phases 4–8
