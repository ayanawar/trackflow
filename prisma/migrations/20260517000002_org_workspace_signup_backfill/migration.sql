-- Stage 2 of 3 — Data backfill (single transaction).
-- See specs/009-org-workspace-signup/data-model.md.
-- Requires pgcrypto for gen_random_uuid (already enabled on Neon/Railway).

BEGIN;

-- 2.1 — Ensure every user belongs to at least one Organization.
INSERT INTO "organizations" ("id", "name", "slug", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  COALESCE(NULLIF(u."workspace", 'My Workspace'), u."name" || '''s Organization'),
  lower(regexp_replace(COALESCE(NULLIF(u."workspace", 'My Workspace'), u."name"), '\W+', '-', 'g'))
    || '-' || substr(md5(u."id"), 1, 4),
  now(), now()
FROM "users" u
LEFT JOIN "memberships" m ON m."userId" = u."id"
WHERE m."id" IS NULL;

INSERT INTO "memberships" ("id", "userId", "orgId", "role", "createdAt")
SELECT gen_random_uuid()::text, u."id", o."id", 'OWNER', now()
FROM "users" u
JOIN "organizations" o
  ON o."name" = COALESCE(NULLIF(u."workspace", 'My Workspace'), u."name" || '''s Organization')
LEFT JOIN "memberships" m ON m."userId" = u."id"
WHERE m."id" IS NULL;

-- 2.2 — Create one Workspace per distinct (orgId, user.workspace string) tuple.
INSERT INTO "workspaces" ("id", "orgId", "name", "normalizedName", "createdById", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  m."orgId",
  COALESCE(u."workspace", 'My Workspace'),
  lower(trim(COALESCE(u."workspace", 'My Workspace'))),
  MIN(u."id"),
  now(), now()
FROM "users" u
JOIN "memberships" m ON m."userId" = u."id"
GROUP BY m."orgId", COALESCE(u."workspace", 'My Workspace');

-- 2.3 — WorkspaceMembership for each user → their resolved workspace(s).
INSERT INTO "workspace_memberships" ("id", "workspaceId", "userId", "role", "createdAt")
SELECT gen_random_uuid()::text, w."id", u."id",
       CASE WHEN m."role" IN ('OWNER','ADMIN') THEN 'ADMIN'::"WorkspaceRole"
            ELSE 'MEMBER'::"WorkspaceRole" END,
       now()
FROM "users" u
JOIN "memberships" m ON m."userId" = u."id"
JOIN "workspaces"  w ON w."orgId"  = m."orgId"
                    AND w."normalizedName" = lower(trim(COALESCE(u."workspace", 'My Workspace')));

-- 2.4 — Each user's activeWorkspaceId points at their primary workspace
-- (one matching their current `workspace` string in their earliest org membership).
UPDATE "users" u
SET "activeWorkspaceId" = sub."id"
FROM (
  SELECT DISTINCT ON (u2."id") u2."id" AS user_id, w."id"
  FROM "users" u2
  JOIN "memberships" m ON m."userId" = u2."id"
  JOIN "workspaces" w ON w."orgId" = m."orgId"
                     AND w."normalizedName" = lower(trim(COALESCE(u2."workspace", 'My Workspace')))
  ORDER BY u2."id", m."createdAt" ASC
) sub
WHERE u."id" = sub.user_id;

-- 2.5 — Backfill workspaceId on every workspace-scoped table from owning user.
UPDATE "tags"         SET "workspaceId" = u."activeWorkspaceId"
  FROM "users" u
  WHERE "tags"."userId" = u."id"
    AND (
      "tags"."workspaceId" IS NULL
      OR NOT EXISTS (SELECT 1 FROM "workspaces" w WHERE w."id" = "tags"."workspaceId")
    );

UPDATE "time_entries" SET "workspaceId" = u."activeWorkspaceId"
  FROM "users" u WHERE "time_entries"."userId" = u."id";

UPDATE "projects"     SET "workspaceId" = u."activeWorkspaceId"
  FROM "users" u WHERE "projects"."userId" = u."id";

UPDATE "clients"      SET "workspaceId" = u."activeWorkspaceId"
  FROM "users" u WHERE "clients"."createdById" = u."id";

-- Clients with NULL createdById fall back to their first project's workspace.
UPDATE "clients" c
SET "workspaceId" = p."workspaceId"
FROM "projects" p
WHERE c."id" = p."clientId" AND c."workspaceId" IS NULL;

UPDATE "tasks" tk SET "workspaceId" = p."workspaceId"
  FROM "projects" p WHERE tk."projectId" = p."id";

-- Invitations: pin each pending invitation to the org's earliest workspace.
UPDATE "invitations" i
SET "workspaceId" = w."id"
FROM "workspaces" w
WHERE i."orgId" = w."orgId"
  AND w."createdAt" = (SELECT MIN("createdAt") FROM "workspaces" WHERE "orgId" = i."orgId");

COMMIT;
