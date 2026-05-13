# Research: Google OAuth Sign-In & Registration

**Date**: 2026-05-13 | **Branch**: `004-google-oauth-signin`

## Decision Log

| # | Decision | Rationale | Alternatives Rejected |
|---|----------|-----------|----------------------|
| 1 | `google-auth-library` for backend ID token verification | Official Google Node.js client; single call handles JWKS, signature, expiry, audience | Manual JWKS + `jose` (extra complexity) |
| 2 | `@react-oauth/google` with `GoogleLogin` component | Returns ID token directly in `onSuccess`; supports dark theme; provider-based setup | Raw GIS script (more boilerplate); `useGoogleLogin` implicit (access token only); auth-code (needs client secret) |
| 3 | `password String?` (nullable) in Prisma schema | Google-only accounts have no password; non-destructive migration | Separate `GoogleUser` table (unnecessary join complexity) |
| 4 | Block + inform on duplicate email | Security: prevents account hijack via Google identity with known email | Auto-link (security risk, rejected per spec FR-007) |
| 5 | Add `/api/auth/google` to `PUBLIC_API_PATHS` in middleware | Route is entry point for unauthenticated users; middleware must not block it | N/A |
| 6 | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` single env var | Client ID is public-facing (appears in browser); `NEXT_PUBLIC_` makes it available both client and server-side | Separate `GOOGLE_CLIENT_ID` server var (redundant since Client ID is not secret) |

## No NEEDS CLARIFICATION items remaining

All ambiguities resolved via `/speckit.clarify` session (2026-05-13):
- OAuth flow → ID token (not auth-code; no client secret needed)
- Duplicate email → block and inform (not auto-link)
- Session after Google auth → reuse existing `tf_token` JWT cookie mechanism
