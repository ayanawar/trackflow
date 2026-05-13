---
description: "Task list for Google OAuth Sign-In & Registration"
---

# Tasks: Google OAuth Sign-In & Registration

**Input**: Design documents from `/specs/004-google-oauth-signin/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**No test tasks** — not requested in spec. Verification is manual/visual per story checkpoints.

**Organization**: Foundation-first — all shared backend work lands in Phase 2 before any frontend story work begins.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup

**Purpose**: Install new dependencies and configure environment variables before any code changes.

- [x] T001 Install `google-auth-library` and `@react-oauth/google` packages via `npm install google-auth-library @react-oauth/google` in project root
- [x] T002 [P] Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>` entry to `.env.example` with a comment explaining it is the public OAuth Client ID (not a secret); also add the same entry to `.env.local` with the actual value `781673401541-c9foktai0vu35l5s2cbma2sdqk7vq6rb.apps.googleusercontent.com`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: All shared backend infrastructure — schema, repository, service, API endpoint, middleware, frontend provider, and button component. MUST be complete before any user story frontend work.

**⚠️ CRITICAL**: No user story work (Phases 3–5) can begin until this phase is complete.

- [x] T003 Update `prisma/schema.prisma` User model: change `password String` to `password String?`, add `googleId String? @unique` and `avatarUrl String?` fields after `password`
- [x] T004 Run `npx prisma db push` in project root to apply schema changes to the local dev database and regenerate the Prisma client (confirm no errors before proceeding)
- [x] T005 Add `findByGoogleId(googleId: string)` function to `src/repositories/user.repository.ts` — `prisma.user.findUnique({ where: { googleId }, select: { ...select, avatarUrl: true } })` where `select` is the existing constant
- [x] T006 Add `createGoogleUser(data: { googleId: string; email: string; name: string; avatarUrl: string | null })` function to `src/repositories/user.repository.ts` — `prisma.user.create({ data: { ...data, password: null, workspace: 'My Workspace' }, select: { ...select, avatarUrl: true } })`
- [x] T007 [P] Add `googleAuthSchema` to `src/lib/schemas.ts`: `export const googleAuthSchema = z.object({ idToken: z.string().min(1) })`
- [x] T008 [P] Add `avatarUrl?: string | null` field to the `AuthUser` interface in `src/lib/authStore.ts`
- [x] T009 Add `googleAuth(idToken: string)` async function to `src/services/auth.service.ts`: import `OAuth2Client` from `google-auth-library`; verify the token with `audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID`; check `email_verified`; call `findByGoogleId` → `findByEmail` → `createGoogleUser` in order; return the user row (see plan.md Phase 1 Implementation Notes for full function body)
- [x] T010 Create `src/app/api/auth/google/route.ts`: export `const dynamic = 'force-dynamic'`; export `async function POST(req: NextRequest)` that parses body with `googleAuthSchema.safeParse`, calls `googleAuth(idToken)` from auth service, then calls `signToken` + `setTokenCookie` + returns `ok({ user, token })` — mirror the structure of `src/app/api/auth/register/route.ts`; catch `'Invalid Google token'` errors as 401, other known errors as 400, unknown as 500
- [x] T011 Add `'/api/auth/google'` to the `PUBLIC_API_PATHS` array in `src/middleware.ts` (line currently reads `['/api/auth/login', '/api/auth/register', '/api/auth/me']`)
- [x] T012 [P] Wrap the `QueryClientProvider` children in `src/components/layout/Providers.tsx` with `GoogleOAuthProvider` from `@react-oauth/google`, passing `clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}` as prop
- [x] T013 [P] Create `src/components/auth/GoogleSignInButton.tsx`: `'use client'` component accepting props `{ onSuccess: (idToken: string) => void; onError: (message: string) => void; disabled?: boolean }`; render `<GoogleLogin>` from `@react-oauth/google` inside a `<div className="w-full">` wrapper; use `theme="filled_black"`, `shape="rectangular"`, `text="continue_with"`, `width="352"`; in `onSuccess` call `onSuccess(credentialResponse.credential!)`; in `onError` call `onError('Google sign-in was cancelled.')`

**Checkpoint**: Backend is fully wired. `POST /api/auth/google` with a valid Google ID token should return `{ user, token }` and set the `tf_token` cookie. ✓

---

## Phase 3: User Story 1 — New User Registers via Google (Priority: P1) 🎯 MVP

**Goal**: "Continue with Google" button appears on the registration page and successfully creates a new account + logs the user in.

**Independent Test**: Navigate to `/auth/register`. Click "Continue with Google." Complete Google consent for an account with no existing TrackFlow registration. Verify redirect to `/tracker` and the user is authenticated with correct name/email.

### Implementation for User Story 1

- [x] T014 [US1] Modify `src/app/auth/register/page.tsx`: add `useState<string | null>(null)` for `googleError`; add `googleMutation` using `useMutation` that POSTs `{ idToken }` to `/auth/google` with `onSuccess: ({ data }) => { setUser(data.user); router.push('/tracker') }` and `onError: (err: any) => setGoogleError(err.response?.data?.error ?? 'Google sign-in failed. Please try again.')`; render `<GoogleSignInButton>` above the form with an "or" divider below it (see plan.md Phase 1 Implementation Notes for JSX snippet); show `{googleError && <p className="text-xs text-accent-red mt-2">{googleError}</p>}` below the button

**Checkpoint**: Registration page shows Google button. New Google account creates user and redirects to `/tracker`. ✓

---

## Phase 4: User Stories 2 & 4 — Existing Google User + Login Page (Priority: P1 & P2)

**Goal**: "Continue with Google" button appears on the login page; returning Google-registered users sign in to their existing account without a duplicate being created.

**Independent Test**: Complete Phase 3 (register via Google). Sign out. Navigate to `/auth/login`. Click "Continue with Google" with the same account. Verify redirect to `/tracker` — same user ID, no duplicate account.

### Implementation for User Stories 2 & 4

- [x] T015 [US2] Modify `src/app/auth/login/page.tsx`: apply identical changes as T014 — add `googleError` state, add `googleMutation` with the same POST `/auth/google` call and handlers, render `<GoogleSignInButton>` with "or" divider above the email/password form

**Checkpoint**: Login page shows Google button. Returning Google user signs in to existing account. Login page parity with register page confirmed (US4). ✓

---

## Phase 5: User Story 3 — Duplicate Email Conflict (Priority: P2)

**Goal**: A user with an existing email/password account who tries Google sign-in with the same email sees the exact blocking message from FR-007 — no duplicate account created.

**Independent Test**: Create an account via the email/password form using `test@example.com`. Sign out. Click "Continue with Google" using a Google account associated with `test@example.com`. Verify the message "An account with this email already exists. Please sign in with your email and password." appears and no second account is created.

### Implementation for User Story 3

- [x] T016 [US3] Verify the duplicate-email error path in `src/services/auth.service.ts` `googleAuth` function (T009): confirm the `findByEmail` branch throws `new Error('An account with this email already exists. Please sign in with your email and password.')` when a user with `googleId === null` is found; also confirm the frontend `onError` handler in both pages uses `err.response?.data?.error` to surface this exact string

**Checkpoint**: Email/password account is not overwritten or duplicated when the same email is used via Google. Exact error message displays on screen. ✓

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T017 Run `npx tsc --noEmit` in project root — confirm zero TypeScript errors across all modified files
- [x] T018 [P] Run `npm run build` — confirm production build succeeds with no errors related to the Google auth changes
- [x] T019 [P] Verify `.env.example` documents both `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and a note that `NEXTAUTH_URL` must be HTTPS in production (Google OAuth requires HTTPS redirect URIs in prod)
- [ ] T020 Manual cross-browser check: open `/auth/register` on a mobile viewport (390px DevTools) — confirm Google button renders and is tappable without overflow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 (packages installed) — **BLOCKS all story phases**
- **US1 (Phase 3)**: Depends on all of Phase 2 complete
- **US2+US4 (Phase 4)**: Depends on all of Phase 2 complete — can run in parallel with Phase 3
- **US3 (Phase 5)**: Depends on T009 (service logic) + T014 + T015 (frontend error handling)
- **Polish (Phase 6)**: Depends on all implementation tasks complete

### Within Phase 2 (Foundational) Order

```
T001 (install) → T003 (schema) → T004 (db push) → T005, T007, T008 (parallel) → T006 → T009 → T010
                                                    T011, T012, T013 (parallel, independent of T005-T009)
```

### User Story Dependencies

- **US1 (P1)**: Start after Phase 2 — no dependency on US2/US3/US4
- **US2+US4 (P1)**: Start after Phase 2 — independent of US1 (different file: login vs. register page)
- **US3 (P2)**: Verification only — depends on T009 (backend) + T014 + T015 (frontend error display)

---

## Parallel Example: Phase 2 Foundational

```
# After T004 (db push) completes, these can run simultaneously:
T005 → user.repository.ts: findByGoogleId
T007 → schemas.ts: googleAuthSchema
T008 → authStore.ts: avatarUrl field
T011 → middleware.ts: PUBLIC_API_PATHS
T012 → Providers.tsx: GoogleOAuthProvider
T013 → GoogleSignInButton.tsx: new component

# After T005 completes:
T006 → user.repository.ts: createGoogleUser

# After T005 + T006 + T007 complete:
T009 → auth.service.ts: googleAuth function

# After T009 + T007 + T008 complete:
T010 → api/auth/google/route.ts: POST handler
```

## Parallel Example: Phases 3 & 4

```
# After Phase 2 complete, T014 and T015 can run simultaneously:
T014 → register/page.tsx: add Google button (US1)
T015 → login/page.tsx: add Google button (US2+US4)
```

---

## Implementation Strategy

### MVP First (US1 + US2 — both P1)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T013) — CRITICAL, blocks everything
3. Complete Phase 3: US1 register page (T014)
4. Complete Phase 4: US2+US4 login page (T015)
5. **STOP and VALIDATE**: test new registration + returning login end-to-end
6. Both P1 stories now deliver a working Google sign-in feature

### Incremental Delivery

1. Setup + Foundational → backend is ready (can be API-tested independently)
2. Add register page button (US1) → new users can register via Google
3. Add login page button (US2+US4) → returning users can sign in
4. Verify conflict path (US3) → duplicate prevention confirmed
5. Polish + build check

---

## Notes

- T001 must complete before ANY other task (packages required throughout)
- T004 (`prisma db push`) must complete before T005/T006 (generated client reflects new schema)
- T009 (`googleAuth` service) is the most critical task — it implements all three resolution paths (return, block, create)
- T010 (API route) mirrors the structure of `src/app/api/auth/register/route.ts` — use it as a reference
- T014 and T015 are identical in structure — implement T014 first to establish the pattern, then T015
- The `width="352"` prop on `GoogleLogin` matches the max-width of the auth card (`max-w-[min(24rem,...)]`)
- No Google secrets are stored anywhere — ID token flow uses only the public `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
