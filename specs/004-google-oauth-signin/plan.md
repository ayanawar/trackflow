# Implementation Plan: Google OAuth Sign-In & Registration

**Branch**: `004-google-oauth-signin` | **Date**: 2026-05-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-google-oauth-signin/spec.md`

## Summary

Add "Continue with Google" to the existing `/auth/login` and `/auth/register` pages using the Google Identity Services ID token flow. The frontend obtains a Google-signed JWT (ID token) via `@react-oauth/google`, POSTs it to a new `/api/auth/google` endpoint, the backend verifies it with `google-auth-library`, and issues the same `tf_token` JWT cookie already used by email/password auth — no new session mechanism, no Google secrets required.

## Technical Context

**Language/Version**: TypeScript / Next.js 14.2.5 App Router / React 18
**Auth**: JWT via `jose` (HS256), httpOnly cookie `tf_token`, 30-day expiry — reused unchanged
**DB**: Prisma ORM, SQLite (dev) / PostgreSQL (prod) — schema migration required
**Frontend state**: Zustand with persist (`AuthUser`), TanStack Query v5 mutations
**New packages**:
- `google-auth-library` — Google's official Node.js library for server-side ID token verification
- `@react-oauth/google` — React wrapper for Google Identity Services; provides `GoogleOAuthProvider` + `GoogleLogin` component

**Environment variables (new)**:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — the Google OAuth Client ID; `NEXT_PUBLIC_` prefix makes it available in the browser bundle (required for GIS) and accessible server-side via `process.env`
- No `GOOGLE_CLIENT_SECRET` needed — ID token flow verifies using Google's public keys only

**Target Platform**: Web — desktop + mobile (Chrome, Safari, Firefox)
**Constraints**: Must not modify `signToken`/`setTokenCookie`/`verifyToken` in `src/lib/auth.ts`; must not alter `/api/auth/login` or `/api/auth/register` routes

## Constitution Check

Constitution file is a blank template — no project-specific gates defined. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-google-oauth-signin/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── contracts/
│   └── google-auth.md   ← Phase 1 output
└── tasks.md             ← /speckit.tasks output
```

### Source Code (all affected files)

```text
prisma/
└── schema.prisma                              MODIFY: googleId, avatarUrl; password nullable

src/
├── app/
│   ├── api/auth/google/
│   │   └── route.ts                          CREATE: POST /api/auth/google
│   └── auth/
│       ├── login/page.tsx                    MODIFY: add GoogleSignInButton + divider
│       └── register/page.tsx                 MODIFY: add GoogleSignInButton + divider
├── components/
│   ├── auth/
│   │   └── GoogleSignInButton.tsx            CREATE: reusable button component
│   └── layout/
│       └── Providers.tsx                     MODIFY: add GoogleOAuthProvider
├── lib/
│   ├── authStore.ts                          MODIFY: add avatarUrl to AuthUser
│   └── schemas.ts                            MODIFY: add googleAuthSchema
├── middleware.ts                             MODIFY: add /api/auth/google to PUBLIC_API_PATHS
├── repositories/
│   └── user.repository.ts                   MODIFY: add findByGoogleId, createGoogleUser
└── services/
    └── auth.service.ts                       MODIFY: add googleAuth function

.env.example                                  MODIFY: document NEXT_PUBLIC_GOOGLE_CLIENT_ID
```

## Complexity Tracking

No constitution violations.

## Phase 0: Research

### Finding 1 — Backend ID Token Verification

**Decision**: Use `google-auth-library` (`OAuth2Client.verifyIdToken`) for server-side verification.

**Rationale**: This is Google's official Node.js client. A single call verifies the JWT signature against Google's public JWKS, checks expiry, and validates the `aud` claim against the Client ID. No manual key management.

**Usage**:
```ts
import { OAuth2Client } from 'google-auth-library'
const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
const ticket = await client.verifyIdToken({
  idToken,
  audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
})
const payload = ticket.getPayload()
// payload.sub, payload.email, payload.name, payload.picture, payload.email_verified
```

**Alternatives rejected**: Manual JWKS + `jose` — duplicates `google-auth-library`'s logic with extra maintenance overhead.

---

### Finding 2 — Frontend GIS Integration

**Decision**: Use `@react-oauth/google` — `GoogleOAuthProvider` in `Providers.tsx`, `GoogleLogin` component in the button.

**Rationale**: `GoogleLogin`'s `onSuccess(credentialResponse)` delivers `credentialResponse.credential` — the ID token string the backend needs. Supports `theme="filled_black"` for dark UI. The provider is added once to `Providers.tsx` so both auth pages pick it up automatically.

**Usage in `GoogleSignInButton.tsx`**:
```tsx
import { GoogleLogin } from '@react-oauth/google'
<GoogleLogin
  onSuccess={(cr) => onSuccess(cr.credential!)}
  onError={() => onError('Google sign-in was cancelled.')}
  theme="filled_black"
  shape="rectangular"
  text="continue_with"
  width="352"
/>
```

**Alternatives rejected**: Raw GIS script injection (more boilerplate); `useGoogleLogin` implicit flow (returns access token, not ID token); auth-code flow (requires Client Secret).

---

### Finding 3 — Database Migration

**Decision**: Make `password String?` (nullable), add `googleId String? @unique`, add `avatarUrl String?`.

**Migration safety**: Making a column nullable and adding new nullable columns are non-destructive on both SQLite and PostgreSQL. Existing email/password users are unaffected (their `password` values remain, `googleId`/`avatarUrl` are null).

---

### Finding 4 — Duplicate Account Logic

**Decision**: Block with exact error message; no auto-linking.

**Lookup order in `googleAuth`**:
1. `findByGoogleId(sub)` → found → log in (returning Google user)
2. `findByEmail(email)` → found, no googleId → 400: *"An account with this email already exists. Please sign in with your email and password."*
3. Neither → `createGoogleUser(...)` → log in (new Google user)

---

### Finding 5 — Middleware Public Path

**Decision**: Add `'/api/auth/google'` to `PUBLIC_API_PATHS` in `src/middleware.ts`.

**Rationale**: Unauthenticated users hitting this endpoint have no `tf_token` cookie yet — the middleware must allow the request through before the route handler issues one.

---

### Finding 6 — Frontend Error State

**Decision**: Local `useState<string | null>` for Google error messages per page, consistent with how `mutation.isError` is used for email/password errors.

**Error messages**:
- Cancelled popup → *"Google sign-in was cancelled."*
- Backend 400 duplicate → surface `response.data.error` verbatim (the spec-required message)
- Backend 401 → *"Google verification failed. Please try again."*
- Network error → *"Could not reach the server. Please check your connection."*

## Phase 1: Design & Contracts

### Data Model

See `data-model.md`. User model delta:

| Field | Before | After | Notes |
|---|---|---|---|
| `password` | `String` | `String?` | Nullable for Google-only accounts |
| `googleId` | — | `String? @unique` | Google UID (`sub` from ID token) |
| `avatarUrl` | — | `String?` | Profile picture URL from Google |

### API Contract

See `contracts/google-auth.md`. Summary:

```
POST /api/auth/google
Body:    { "idToken": "<Google JWT>" }

200 OK:  { "user": { id, name, email, workspace, avatarUrl }, "token": "<tf_token>" }
         + Set-Cookie: tf_token=...; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000
400:     { "error": "An account with this email already exists. Please sign in with your email and password." }
400:     { "error": "Google account email is not verified." }
401:     { "error": "Invalid Google token" }
500:     { "error": "Internal server error" }
```

### Implementation Notes

**`src/services/auth.service.ts`** — add `googleAuth(idToken: string)`:
- Instantiate `OAuth2Client` per request (or module-level singleton — both work)
- Call `verifyIdToken`, extract payload
- Check `email_verified` → throw if false
- `findByGoogleId` → `findByEmail` → `createGoogleUser` (in order)
- Return user row; route handler calls `signToken` + `setTokenCookie` (same as register route)

**`src/repositories/user.repository.ts`** — add:
- `findByGoogleId(googleId: string)` — `prisma.user.findUnique({ where: { googleId }, select: { ...select, avatarUrl: true } })`
- `createGoogleUser({ googleId, email, name, avatarUrl })` — `prisma.user.create` with `password: null`

**`src/lib/authStore.ts`** — `AuthUser` gains optional `avatarUrl?: string | null`

**`src/components/auth/GoogleSignInButton.tsx`** — props: `onSuccess(idToken: string): void`, `onError(message: string): void`, `disabled?: boolean`. Renders `GoogleLogin` inside a full-width container.

**Register/Login pages** — add above the form:
```tsx
<GoogleSignInButton onSuccess={idToken => googleMutation.mutate(idToken)} onError={setGoogleError} />
{googleError && <p className="text-xs text-accent-red">{googleError}</p>}
<div className="relative my-4">
  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
  <div className="relative flex justify-center text-xs"><span className="bg-[rgb(var(--bg-card))] px-2 text-white/30">or</span></div>
</div>
```

**`googleMutation`** in both pages:
```ts
const googleMutation = useMutation({
  mutationFn: (idToken: string) => api.post('/auth/google', { idToken }),
  onSuccess: ({ data }) => { setUser(data.user); router.push('/tracker') },
  onError: (err: any) => setGoogleError(err.response?.data?.error ?? 'Google sign-in failed. Please try again.'),
})
```

**`Providers.tsx`** — wrap children with `GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}`.
