# Feature Specification: Clean Code Architecture Refactor

**Feature Branch**: `003-clean-code-arch`
**Created**: 2026-05-13
**Status**: Draft
**Input**: Refactor and improve the current application to follow clean code architecture, SOLID principles, scalability, maintainability, and security best practices.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Security Vulnerabilities Eliminated (Priority: P1)

A developer reviewing the production build should find no exposed secrets, no client-side third-party API calls using credentials, and no HTML injection points.

**Why this priority**: The Insights page currently makes direct Anthropic API calls from the browser, and AI response text is injected via `dangerouslySetInnerHTML` without sanitization. These are active security vulnerabilities that can expose credentials and enable XSS. They must be fixed before anything else.

**Independent Test**: Navigate to the AI Insights page, ask a question, and verify the response is rendered. Then inspect network traffic and confirm no calls are made from the browser directly to `api.anthropic.com`. Inspect the response rendering and confirm no unsanitized HTML is injected.

**Acceptance Scenarios**:

1. **Given** the Insights feature is enabled, **When** a user submits a question, **Then** the request is proxied through the application's own API — not sent directly from the browser to any third-party service.
2. **Given** the AI returns markdown-formatted text, **When** it is rendered in the UI, **Then** HTML special characters are escaped and the content is rendered safely without raw HTML injection.
3. **Given** the application starts, **When** `JWT_SECRET` is not set in the environment, **Then** the application refuses to boot or logs a critical warning — it does NOT fall back to a hardcoded string.
4. **Given** any user input (form fields, query params, API request bodies), **When** submitted, **Then** all inputs are validated against defined schemas before any processing occurs.

---

### User Story 2 — Separation of Concerns: Service and Repository Layers (Priority: P2)

A developer adding a new feature should be able to follow a clear pattern: route handler → service → repository — without duplicating validation or data-access logic.

**Why this priority**: Currently, API route handlers mix authentication checks, input validation, business logic, and database queries all in the same function body. This makes the code hard to test in isolation, easy to accidentally break, and painful to extend.

**Independent Test**: Inspect any API route handler and confirm it delegates data access to a repository function and business logic to a service function. Add a hypothetical new field to time entries and trace the change — it should require touching at most two files (schema + repository).

**Acceptance Scenarios**:

1. **Given** an API route handler for `POST /api/time-entries`, **When** the handler is read, **Then** it contains no direct Prisma calls — all DB access is delegated to a repository layer.
2. **Given** a service function for creating a time entry, **When** it is called, **Then** it can be unit-tested without spinning up an HTTP server.
3. **Given** the business rule "stop any running entry before creating a new one", **When** it is implemented, **Then** it lives in a service function — not inline in the route handler.
4. **Given** multiple API routes need to verify ownership of a resource before acting on it, **When** implemented, **Then** a single reusable authorization utility handles the check — not duplicated per route.

---

### User Story 3 — Shared Custom Hooks and Data-Access Abstractions (Priority: P2)

A frontend developer adding a new page should not need to copy-paste `useQuery` boilerplate or import `apiClient` directly in every component.

**Why this priority**: Several pages fetch the same resources (`projects`, `stats`, `timeEntries`) with identical `useQuery` configurations. This duplication means any change to caching strategy or API shape must be made in multiple places.

**Independent Test**: Identify all pages that fetch `projects`. Confirm each delegates to the same custom hook (`useProjects`) rather than defining its own query inline.

**Acceptance Scenarios**:

1. **Given** the Tracker, Dashboard, and Projects pages all need project data, **When** they fetch it, **Then** all three use the same shared `useProjects` custom hook.
2. **Given** the Tracker and Dashboard both need stats data, **When** they fetch it, **Then** both use the same shared `useStats` custom hook.
3. **Given** a component needs to mutate a time entry, **When** it does so, **Then** it uses a shared mutation hook that also handles cache invalidation — rather than configuring `useMutation` inline.
4. **Given** the API base URL or credentials strategy changes, **When** updated, **Then** only the `apiClient` module needs to change — no page or component imports a raw HTTP client.

---

### User Story 4 — Type Safety and Schema Consistency (Priority: P3)

A TypeScript developer should be able to trust that types flowing from the API layer match what the UI expects, without any implicit `any` casts or inline schema definitions scattered across files.

**Why this priority**: Some schemas are defined inline (e.g., `updateSchema` in `me/route.ts`) rather than in `schemas.ts`. This risks drift between frontend types and backend validators.

**Independent Test**: Run TypeScript's type checker with strict mode. Confirm zero errors. Verify all Zod schemas are centralized in `src/lib/schemas.ts` (or a dedicated schemas module) with no inline schema definitions in route handlers.

**Acceptance Scenarios**:

1. **Given** the API handler for `PATCH /api/auth/me`, **When** the code is read, **Then** it imports its validation schema from `src/lib/schemas.ts` — not defining it inline.
2. **Given** TypeScript strict mode is enabled, **When** the project compiles, **Then** zero type errors are reported.
3. **Given** a type is shared between API response and UI consumption, **When** defined, **Then** it lives in `src/types/index.ts` and is imported by both — not redefined separately.

---

### User Story 5 — Performance: Stats Query Consolidation (Priority: P3)

The stats API should complete in one database round-trip aggregate — not 12 separate sequential/parallel queries.

**Why this priority**: `GET /api/stats` currently executes up to 12 database queries (today/week/month counts, total count, projects with entries, and 7 daily totals). This is an N+1-style problem that will degrade under load.

**Independent Test**: Profile `GET /api/stats` with a database query logger enabled. Confirm the number of executed queries is 4 or fewer (one per aggregate window, or a single grouped query with Prisma's `groupBy`).

**Acceptance Scenarios**:

1. **Given** a user visits the Dashboard, **When** the stats API is called, **Then** the server executes no more than 4 database queries to fulfill the response.
2. **Given** stats data has not changed, **When** the same data is requested within the configured cache window, **Then** no additional database queries are executed.
3. **Given** the refactored stats query, **When** run against the same dataset, **Then** it returns identical values to the previous implementation.

---

### User Story 6 — UX: Tag Input Replaced (Priority: P3)

The `prompt()` browser dialog used for tag input in the TimerBar must be replaced with an in-line UI control.

**Why this priority**: `prompt()` is a blocking browser dialog that cannot be styled, is inaccessible, and is blocked in some iframe/browser contexts. It is the only place in the app that uses this pattern.

**Independent Test**: Click the Tag button in the TimerBar. Confirm a styled dropdown or inline text input appears — no browser `prompt()` dialog is shown.

**Acceptance Scenarios**:

1. **Given** the TimerBar is visible, **When** the user clicks the Tag button, **Then** an inline text input appears showing the user's existing tags as clickable suggestions.
2. **Given** the tag input is open, **When** the user clicks an existing tag suggestion, **Then** that tag is selected and displayed in the TimerBar immediately.
3. **Given** the tag input is open, **When** the user types a new tag name not in their existing tags, **Then** the typed text is accepted as the tag on confirmation — no blocking dialog is shown.

---

### Edge Cases

- What happens when a route handler receives a malformed JSON body? The response must be a structured `400` error — not a 500 crash.
- How does the system handle a running time entry being stopped concurrently from two browser tabs? The second stop should be a no-op (idempotent) rather than producing a 404 or 500.
- What happens when the AI proxy endpoint is called without a question? It should return a structured `400` error with a clear message.
- What happens when a user exceeds the AI proxy rate limit? The server must return a `429 Too Many Requests` response; the UI must display a user-friendly "slow down" message — not a generic error.
- How does the application behave if the Anthropic API is unreachable? The UI MUST display a generic message ("AI is unavailable, please try again") — no HTTP status codes, provider names, model names, or raw error detail may be shown to the user.
- What happens when `buildISO` in `EntryModal.tsx` receives an invalid time string? Input should be validated before the ISO date is constructed.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST proxy all third-party AI API calls through a server-side route — no third-party API calls may originate from the browser. The proxy endpoint MUST enforce a per-user rate limit (maximum 10 requests per minute per authenticated user) to prevent cost abuse.
- **FR-002**: All AI-generated or user-supplied content rendered as HTML MUST be sanitized or escaped before being inserted into the DOM.
- **FR-003**: The `JWT_SECRET` environment variable MUST be required at startup; the application MUST NOT silently fall back to a hardcoded string.
- **FR-004**: All API route handlers MUST validate request bodies using shared Zod schemas from `src/lib/schemas.ts` before processing.
- **FR-005**: All database access from ALL existing and future API routes MUST be delegated to repository functions — route handlers MUST NOT contain direct Prisma client calls. This applies to every route in the codebase, migrated in full during this sprint.
- **FR-006**: Business rules (e.g., auto-stopping a running timer) MUST live in service functions — not inline in route handlers. All existing routes are in scope for this migration.
- **FR-007**: Authorization checks (resource ownership verification) MUST be implemented in a shared utility — not duplicated across routes.
- **FR-008**: All Zod schemas MUST be centralized in `src/lib/schemas.ts`; no inline schema definitions are permitted in route files.
- **FR-009**: Data-fetching logic for shared resources (projects, stats, time entries) MUST be extracted into custom React Query hooks in `src/hooks/`.
- **FR-010**: The `TagInput` interaction in `TimerBar` MUST use a styled in-app UI control — the browser `prompt()` dialog MUST NOT be used. The control MUST display the user's existing saved tags as clickable suggestions and MUST also allow free-text entry of a new tag name.
- **FR-011**: The `GET /api/stats` route MUST execute no more than 4 database queries per request.
- **FR-012**: The `authStore` logout action MUST be decoupled from navigation — navigation side effects MUST be handled in the consuming component, not inside the store.
- **FR-013**: All TypeScript files MUST compile without errors under strict mode.
- **FR-014**: The application MUST remove the hardcoded demo credentials displayed on the login page.

### Key Entities

- **Repository**: A module responsible for all database access for a single domain entity (User, Project, TimeEntry, Tag). Accepts plain data arguments, returns plain data.
- **Service**: A module that orchestrates business rules using one or more repositories. Contains no HTTP-specific logic.
- **Custom Hook**: A React hook (`use*`) that encapsulates a `useQuery` or `useMutation` call for a specific domain resource. Lives in `src/hooks/`.
- **Schema**: A Zod schema definition in `src/lib/schemas.ts` used for both API input validation and TypeScript type inference.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero TypeScript strict-mode errors after refactoring.
- **SC-002**: `GET /api/stats` executes 4 or fewer database queries per request, verified via Prisma query logging. Repeated calls within a 30-second window execute no additional queries (server-side response cache with 30s TTL).
- **SC-003**: All third-party API calls (Anthropic, etc.) originate exclusively from server-side routes — confirmed by static code analysis (no `fetch` to external domains in `src/app/` client components).
- **SC-004**: No `dangerouslySetInnerHTML` usage remains without an explicit sanitization step immediately preceding it.
- **SC-005**: No inline Zod schema definitions remain in any `route.ts` file — all schemas imported from `src/lib/schemas.ts`.
- **SC-006**: No direct Prisma client calls in any `route.ts` file after refactoring.
- **SC-007**: All existing features (timer start/stop, entry CRUD, project CRUD, dashboard, insights) function identically after refactoring — verified by end-to-end smoke testing.
- **SC-008**: The browser `prompt()` call in `TimerBar.tsx` is replaced — confirmed by static search (`grep -r "prompt(" src/`).
- **SC-009**: `JWT_SECRET` missing from environment causes a server-side startup warning or error — not a silent fallback to a hardcoded value.
- **SC-010**: The AI proxy endpoint returns `429` when a user exceeds 10 requests/minute — confirmed by sending 11 consecutive requests in a test.

---

## Clarifications

### Session 2026-05-13

- Q: Does FR-005/FR-006 (no direct Prisma in route handlers) apply to all existing routes now, or only routes touched during this sprint? → A: All existing routes are migrated in full during this sprint (Option A — full migration).
- Q: What UX should replace the `prompt()` tag input in TimerBar — free-text only, or also show existing tags? → A: Inline text input with the user's existing tags shown as clickable suggestions; free-text entry of new tags also supported (Option B).
- Q: Should the new AI proxy endpoint (POST /api/insights) enforce rate limiting? → A: Yes, per-user rate limit of 10 requests/minute enforced server-side (Option A).
- Q: What is the target cache TTL for the stats endpoint (SC-002 "configured cache window")? → A: 30 seconds.
- Q: When the Anthropic API is unreachable, what error detail should the user see? → A: Generic message only — "AI is unavailable, please try again." No status codes, provider names, or raw error detail exposed (Option A).

---

## Assumptions

- The refactoring is a pure improvement pass — no new user-visible features are introduced beyond the tag input UX fix (FR-010).
- TypeScript strict mode (`"strict": true`) will be enabled in `tsconfig.json` as part of this work; any pre-existing type errors surfaced by enabling strict mode are in scope to fix.
- The Anthropic API proxy endpoint will be added at `POST /api/insights` and will read the API key from a server-side environment variable (`ANTHROPIC_API_KEY`).
- Testing coverage is limited to manually verified smoke tests for each primary user flow; automated unit tests for service and repository layers are a stretch goal, not a hard requirement for this spec.
- The custom hooks layer will use React Query's existing cache keys (`['projects']`, `['stats']`, `['timeEntries']`) to maintain cache-sharing behavior across pages.
- No database schema changes are required for this refactoring.
- The `authStore` Zustand store will remain for client-side user state; only the side-effectful logout navigation will be moved out of the store action into the call site.
