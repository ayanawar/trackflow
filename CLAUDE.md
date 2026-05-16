# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev          # Start dev server (also runs prisma generate)
bun run build        # Build for production
bun run lint         # ESLint
bun run test         # Run all tests (vitest)
bun run test:watch   # Watch mode
bun run db:push      # Push schema changes to DB (dev, no migration)
bun run db:migrate   # Run pending migrations (prod)
bun run db:seed      # Seed demo data
bun run db:studio    # Open Prisma Studio
```

Run a single test file: `bun run vitest run __tests__/auth.routes.test.ts`

## Architecture

**Single Next.js 14 (App Router) monorepo** — frontend and backend coexist. No separate API server.

### Key conventions

- **API routes** live in `src/app/api/`. Each route file exports named HTTP handlers (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`). All must include `export const dynamic = 'force-dynamic'` at the top.
- **Auth**: JWT stored in HttpOnly cookies. `getSessionFromRequest(req)` in `src/lib/auth.ts` validates the token. Always call it first in every API route and return `unauthorized()` if null.
- **Response helpers**: use `ok()`, `created()`, `noContent()`, `badRequest()`, `unauthorized()`, `notFound()`, `serverError()` from `src/lib/response.ts` — never construct `NextResponse` manually.
- **Validation**: Zod schemas live in `src/lib/schemas.ts`. Use `schema.safeParse(body)` and return `badRequest(result.error.issues[0].message)` on failure.
- **Database**: Prisma ORM. Repository functions live in `src/repositories/`. Keep all Prisma calls in repositories — never call `prisma` directly from route handlers.
- **Frontend state**: TanStack Query for server state (hooks in `src/hooks/`), Zustand for auth (`src/lib/authStore.ts`). The `api` client in `src/lib/apiClient.ts` is an Axios instance with `baseURL: "/api"` and cookie credentials; use it for all frontend requests.

### Page layout pattern

Pages live under `src/app/(app)/`. They must be `'use client'` components. The `(app)` layout wraps everything in `AppShell` which renders the `Sidebar`. Page structure:

```tsx
<>
  <div className="page-header ...">...</div>
  <div className="page-body">
    <div className="page-container">...</div>
  </div>
</>
```

### Sidebar navigation

Add new nav links to `src/components/layout/Sidebar.tsx` in either `navItems` (main) or `bottomItems` (tools section). Mobile bottom nav is auto-generated from `mobileItems`.

### Tag model

Tags are per-user (`userId`), have a `name` and `color` (`#rrggbb`). The `Tag` ↔ `TimeEntry` relation is one-to-many via `tagId` on `TimeEntry`. The unique constraint is `(name, userId)`.

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Runtime / pkg mgr | Bun |
| Styling | Tailwind CSS (dark-theme CSS vars via `rgb(var(--bg-primary))` etc.) |
| ORM | Prisma + PostgreSQL (prod) / SQLite (dev) |
| Auth | JWT via `jose`, HttpOnly cookies |
| Validation | Zod |
| Server state | TanStack Query v5 |
| Global state | Zustand v5 |
| Forms | React Hook Form |
| HTTP client | Axios (`src/lib/apiClient.ts`) |
| Icons | Lucide React |

## Environment

Dev uses SQLite (no `DATABASE_URL` needed beyond what `.env.local` pre-configures). Prod (Vercel + Railway/Neon) uses PostgreSQL. `DATABASE_PROVIDER` env var switches the Prisma schema provider.
