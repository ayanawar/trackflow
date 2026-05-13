# API Contract: POST /api/auth/google

**Date**: 2026-05-13 | **Branch**: `004-google-oauth-signin`

## Endpoint

```
POST /api/auth/google
Content-Type: application/json
```

This endpoint is **public** (no `tf_token` cookie required). It must be added to `PUBLIC_API_PATHS` in `src/middleware.ts`.

## Request

```json
{
  "idToken": "<Google ID token JWT string>"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `idToken` | string | YES | Google-issued ID token (JWT) from `credentialResponse.credential` via `@react-oauth/google` |

**Validation** (`googleAuthSchema` in `src/lib/schemas.ts`):
```ts
z.object({ idToken: z.string().min(1) })
```

## Responses

### 200 OK — Sign-in or registration successful

```json
{
  "user": {
    "id": "clx...",
    "name": "John Doe",
    "email": "john@gmail.com",
    "workspace": "My Workspace",
    "avatarUrl": "https://lh3.googleusercontent.com/..."
  },
  "token": "<tf_token JWT>"
}
```

**Set-Cookie header** (identical to email/password login):
```
Set-Cookie: tf_token=<jwt>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000
```

### 400 Bad Request — Duplicate email (email/password account exists)

```json
{
  "error": "An account with this email already exists. Please sign in with your email and password."
}
```

### 400 Bad Request — Unverified Google email

```json
{
  "error": "Google account email is not verified."
}
```

### 400 Bad Request — Missing or malformed body

```json
{
  "error": "<zod validation message>"
}
```

### 401 Unauthorized — Token verification failed

```json
{
  "error": "Invalid Google token"
}
```

Triggered when `google-auth-library` throws during `verifyIdToken` (expired, wrong audience, tampered signature).

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## Flow Diagram

```
Frontend                        Backend (/api/auth/google)        Google
   |                                  |                              |
   |-- Click "Continue with Google" -->|                              |
   |                                  |                              |
   |<------------ GIS popup ----------|------ validate Client ID --->|
   |                                  |<---- ID token (JWT) ---------|
   |                                  |                              |
   |--- POST { idToken } ------------>|                              |
   |                                  |--- verifyIdToken() --------->|
   |                                  |<--- payload (sub, email) ----|
   |                                  |                              |
   |                                  |-- findByGoogleId(sub) ------>DB
   |                                  |-- [if not found] findByEmail ->DB
   |                                  |-- [if neither] createGoogleUser->DB
   |                                  |                              |
   |                                  |-- signToken() ↩             |
   |                                  |-- setTokenCookie() ↩        |
   |<--- 200 { user } + tf_token -----|                              |
   |                                  |                              |
   |-- setUser(user) → push('/tracker')|                             |
```

## Security Notes

- The `idToken` is validated server-side only — the frontend is never trusted for identity claims
- The `aud` claim in the token is checked against `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- No Google access tokens or refresh tokens are stored
- The response `token` field is the app's own JWT — not a Google token
- The endpoint follows the same error handling patterns as `/api/auth/register`
