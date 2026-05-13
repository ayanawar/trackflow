# Data Model: Google OAuth Sign-In & Registration

**Date**: 2026-05-13 | **Branch**: `004-google-oauth-signin`

## Changed Entity: User

### Current Schema (before migration)

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String              // required
  workspace String   @default("My Workspace")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  projects    Project[]
  timeEntries TimeEntry[]
  tags        Tag[]
  @@map("users")
}
```

### Updated Schema (after migration)

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String?             // nullable — null for Google-only accounts
  googleId  String?  @unique    // Google UID (sub claim); null for email/password accounts
  avatarUrl String?             // Google profile picture URL; null if not provided
  workspace String   @default("My Workspace")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  projects    Project[]
  timeEntries TimeEntry[]
  tags        Tag[]
  @@map("users")
}
```

### Field Specifications

| Field | Type | Nullable | Unique | Notes |
|---|---|---|---|---|
| `password` | String | YES | — | Null for Google-only accounts; existing rows keep their hashed passwords |
| `googleId` | String | YES | YES | Google account UID from the `sub` claim of the verified ID token |
| `avatarUrl` | String | YES | — | Google profile picture URL; stored as-is (external URL, not re-hosted) |

### Validation Rules

- A user MUST have either a `password` OR a `googleId` (enforced in service layer, not DB constraint)
- `googleId` + `email` together uniquely identify a Google account (duplicate check uses both in sequence)
- `avatarUrl` is stored verbatim — no length cap beyond PostgreSQL's default TEXT type
- `name` falls back to `email` if Google profile provides no display name

### State Transitions

```
User Account States:
  email/password:  { password: "hash", googleId: null,  avatarUrl: null }
  google-only:     { password: null,   googleId: "sub", avatarUrl: "url" | null }
  (linked — out of scope per spec FR-007)
```

### Migration

**File**: `prisma/migrations/[timestamp]_add_google_auth_fields/migration.sql`

SQLite (dev):
```sql
ALTER TABLE "users" ADD COLUMN "googleId" TEXT;
ALTER TABLE "users" ADD COLUMN "avatarUrl" TEXT;
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
-- password already NOT NULL; SQLite ALTER does not support changing nullability
-- Use: prisma db push (dev) or generate a new migration (prod)
```

PostgreSQL (prod):
```sql
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "googleId" TEXT UNIQUE;
ALTER TABLE "users" ADD COLUMN "avatarUrl" TEXT;
```

> **Note**: For SQLite in development, use `prisma db push` to apply schema changes. For PostgreSQL in production, generate and apply a proper Prisma migration.

## No New Entities

No new database tables are created. The `AuthProvider` concept from the spec is represented by the presence/absence of `googleId` and `password` fields on the single `User` entity — no separate table needed.
