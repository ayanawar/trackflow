# Research: Clean Code Architecture Refactor

**Branch**: `003-clean-code-arch` | **Date**: 2026-05-13 | **Phase**: 0

---

## Decision 1: Rate Limiting for POST /api/insights

**Decision**: In-memory per-user sliding window counter using a module-level `Map<userId, number[]>` (timestamps of recent requests) in a shared `src/lib/rateLimit.ts` utility.

**Rationale**: No external dependency required. Next.js 14 App Router runs in a persistent Node.js process, so a module-level Map survives the process lifetime. A sliding window (drop timestamps older than 60s, count remaining) is accurate and fair. The 10 req/min threshold from the spec is straightforward to enforce at the service layer.

**Alternatives considered**:
- Redis/Upstash `@upstash/ratelimit` — accurate across multiple server instances but adds an external dependency and infra requirement not justified for current scale.
- `next-rate-limit` npm package — thin wrapper that still requires a backing store; no benefit over a hand-rolled solution at this scale.
- Middleware-level rate limiting — too broad; would rate-limit all API routes, not just the AI proxy.

**Limitation**: In-memory state is lost on server restart and does not work correctly across multiple server instances (horizontal scale). Acceptable for current single-instance Vercel deployment. Document as a known limitation with upgrade path to Redis.

---

## Decision 2: Stats Endpoint Caching (30s TTL)

**Decision**: Module-level in-memory cache `Map<userId, { data: Stats; expiresAt: number }>` in the stats service (`src/services/stats.service.ts`). Cache is invalidated on write operations (new/stop time entry) via a shared `invalidateStatsCache(userId)` function.

**Rationale**: Next.js 14's `unstable_cache` is designed for static/ISR build-time caching and has confusing revalidation semantics for per-user data. A simple module-level TTL cache is:
- Deterministic: expires exactly 30s after population
- Invalidatable: call `invalidateStatsCache` from the time-entry service after mutations
- Testable: import the module and manipulate the Map directly

**Alternatives considered**:
- `unstable_cache` (Next.js 14) — per-user `tags` make cache keys complex; revalidation on mutation is non-trivial.
- React Query client-side deduplication — reduces duplicate browser requests but does not reduce DB queries per server request.
- No caching — leaves SC-002 partially met (query count reduced but second requests still hit DB).

---

## Decision 3: AI Response Rendering (XSS Prevention)

**Decision**: Replace `dangerouslySetInnerHTML` with a React component that renders AI text as safe HTML using controlled string transformations: `\n` → `<br>`, `**text**` → `<strong>text</strong>`. All other content rendered as escaped plain text via React's default text rendering (no `dangerouslySetInnerHTML`).

**Rationale**: The Anthropic API returns markdown-formatted text. The only patterns used in the current system prompt are bold (`**...**`) and newlines. These two patterns can be handled with safe, predictable regex replacements on a whitelist basis. React's JSX renderer escapes all other content by default, making the rendered output provably XSS-safe without a sanitization library.

**Alternatives considered**:
- DOMPurify (client-side) — adds a dependency; sanitizes after injection, not before; overkill for controlled AI output.
- `marked` + DOMPurify — heavier pipeline; degrades performance; still requires client-side dependency.
- Plain text only (no markdown) — removes bold formatting from AI responses; degrades readability of lists and emphasis.

**Implementation**: A `<SafeMarkdown text={string} />` component in `src/components/ui/SafeMarkdown.tsx` that splits text on `**...**` boundaries and returns an array of React elements (strings and `<strong>` nodes) plus `<br />` for newlines.

---

## Decision 4: Repository & Service Layer Structure

**Decision**: Introduce `src/repositories/` (one file per Prisma model) and `src/services/` (one file per domain). Route handlers import from services only.

```
src/repositories/
  user.repository.ts        — CRUD for User
  project.repository.ts     — CRUD + aggregation for Project
  timeEntry.repository.ts   — CRUD + running-entry queries for TimeEntry
  tag.repository.ts         — upsert + list for Tag

src/services/
  auth.service.ts           — register, login, getMe, updateMe
  project.service.ts        — createProject, updateProject, deleteProject, listProjects
  timeEntry.service.ts      — createEntry, stopEntry, updateEntry, deleteEntry, listEntries
  stats.service.ts          — getStats (with 30s TTL cache + invalidation)
  insights.service.ts       — askAI (Anthropic proxy + rate limiting)
```

**Rationale**: Flat `repositories/` and `services/` directories are easy to navigate. One file per entity prevents cross-entity coupling. Services are the only callers of repositories, enforcing the layering rule from FR-005/FR-006. Route handlers become thin: parse request → call service → return response.

**Alternatives considered**:
- Colocation inside `app/api/` — keeps logic close to routes but makes cross-route sharing awkward and violates SRP.
- Domain-based subdirectories (e.g., `src/domain/timeEntry/`) — more elaborate; DDD overkill for this project size.
- Single `db.ts` file — consolidates all DB access but becomes a monolith quickly.

---

## Decision 5: Custom React Query Hooks

**Decision**: `src/hooks/` directory with one hook file per resource.

```
src/hooks/
  useProjects.ts       — useProjects(), useCreateProject(), useUpdateProject(), useDeleteProject()
  useTimeEntries.ts    — useTimeEntries(), useCreateEntry(), useStopEntry(), useUpdateEntry(), useDeleteEntry()
  useStats.ts          — useStats()
  useTags.ts           — useTags()
```

**Rationale**: Centralizes `queryKey`, `queryFn`, `refetchInterval`, and `onSuccess` cache invalidation logic. Pages import the hook, not `apiClient`. Changing the API shape or cache strategy requires editing one file, not four pages.

**Alternatives considered**:
- Per-page custom hooks — still duplicates `queryKey` strings; key mismatches cause cache bugs.
- SWR — would require replacing React Query; out of scope.
- Zustand query store — adds complexity for async data that React Query already handles well.

---

## Decision 6: Tag Input Component (TimerBar)

**Decision**: Inline popover component `<TagInput>` in `src/components/tracker/TagInput.tsx`. When opened, fetches the user's existing tags via `useTags()` hook (already cached) and renders them as buttons. A text input at the top allows typing a new tag name. Pressing Enter or clicking a suggestion sets the tag and closes the popover.

**Rationale**: Consistent with the rest of the app's UI patterns (project picker in TimerBar already uses this pattern). Reuses the existing `useTags` hook so no extra API call is made when the popover opens (tags are already cached from the sidebar/tracker load).

**Alternatives considered**:
- Combobox with type-ahead filtering — more complex, requires keyboard navigation; overkill for a list of typically <20 tags.
- Modal — heavier; tag selection is a quick interaction that shouldn't open a full modal.
- Separate page for tag management — out of scope for TimerBar interaction.

---

## Decision 7: JWT_SECRET Guard

**Decision**: Add a startup-time check in `src/lib/auth.ts`: if `process.env.JWT_SECRET` is undefined or is the literal string `"trackflow-secret-key-change-in-production"`, throw an `Error` in production (`NODE_ENV === 'production'`) and log a `console.warn` in development.

**Rationale**: Throwing in production prevents deployment with an insecure secret. Warning in development avoids breaking the local dev experience for engineers who haven't set up `.env.local` yet.

**Alternatives considered**:
- Throw in all environments — blocks local dev without a `.env.local`; poor DX.
- Only `console.warn` — doesn't prevent production deployment with insecure secret.
- Runtime check on every request — adds overhead; better to fail fast at boot.
