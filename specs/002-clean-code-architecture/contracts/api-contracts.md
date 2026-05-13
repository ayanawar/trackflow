# API Contracts: Clean Code Architecture Refactor

**Branch**: `003-clean-code-arch` | **Date**: 2026-05-13

All existing API endpoints retain their current request/response shapes — no breaking changes. This document captures the **new** and **modified** contracts introduced by this refactor.

---

## New: POST /api/insights

Proxies an AI question to Anthropic server-side. Replaces the direct browser-to-Anthropic call in the Insights page.

**Authentication**: Required (JWT cookie)

**Rate limit**: 10 requests per minute per authenticated user

### Request
```
POST /api/insights
Content-Type: application/json
```
```json
{
  "question": "string",
  "context": {
    "todaySeconds": 0,
    "weekSeconds": 0,
    "monthSeconds": 0,
    "totalEntries": 0,
    "projects": [{ "name": "string", "client": "string | null", "totalSeconds": 0 }],
    "recentEntries": [{ "description": "string", "projectName": "string | null", "tagName": "string | null", "durationSeconds": 0 }]
  }
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `question` | string | Yes | 1–500 characters |
| `context` | object | Yes | Passed to Anthropic system prompt server-side |

### Response — 200 OK
```json
{ "answer": "string" }
```

### Response — 400 Bad Request
```json
{ "error": "Question is required" }
```

### Response — 401 Unauthorized
```json
{ "error": "Unauthorized" }
```

### Response — 429 Too Many Requests
```json
{ "error": "Too many requests. Please wait before asking again." }
```
`Retry-After: 60` header included.

### Response — 503 Service Unavailable
```json
{ "error": "AI is unavailable, please try again." }
```
Returned when Anthropic API call fails for any reason (network error, upstream 5xx, timeout). The specific Anthropic error is logged server-side but NOT returned to the client.

---

## Modified: GET /api/stats

No change to response shape. Internal change: adds 30s server-side cache per userId.

**Cache behavior**: Subsequent calls within 30s return cached data without DB queries. Cache is invalidated on any time entry create/stop/update/delete for the same user.

---

## Modified: POST /api/time-entries

No change to request/response shape. Internal change: business logic (stop running entry, tag upsert) moved to `timeEntry.service.ts`.

---

## Modified: PATCH /api/time-entries/[id]/stop

No change to request/response shape. Internal change: delegates to service. Now idempotent — if entry is already stopped, returns the entry as-is with 200 (not 404 or 500).

---

## Repository Layer Contract

Route handlers must interact with the service layer only. The following invariants apply:

| Layer | May import | Must NOT import |
|---|---|---|
| Route Handler | service, `src/lib/response`, `src/lib/auth`, `src/lib/schemas` | `@prisma/client`, `src/lib/prisma` |
| Service | repository, `src/lib/schemas` types, `src/lib/rateLimit` | `next/server`, `next/headers` |
| Repository | `src/lib/prisma` | services, hooks, Next.js APIs |
| Hook | `src/lib/apiClient` | `@prisma/client`, services, repositories |
