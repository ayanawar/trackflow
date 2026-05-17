-- Stage 1 of 3 — Additive schema changes (all new columns nullable).
-- See specs/009-org-workspace-signup/data-model.md.

-- New enum
CREATE TYPE "WorkspaceRole" AS ENUM ('ADMIN', 'MEMBER');

-- Workspace table
CREATE TABLE "workspaces" (
  "id"              TEXT PRIMARY KEY,
  "orgId"           TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name"            TEXT NOT NULL,
  "normalizedName"  TEXT NOT NULL,
  "createdById"     TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "workspaces_orgId_normalizedName_key" ON "workspaces"("orgId", "normalizedName");
CREATE INDEX "workspaces_orgId_idx" ON "workspaces"("orgId");

-- Workspace membership table
CREATE TABLE "workspace_memberships" (
  "id"          TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "userId"      TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role"        "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "workspace_memberships_workspaceId_userId_key" ON "workspace_memberships"("workspaceId", "userId");
CREATE INDEX "workspace_memberships_userId_idx" ON "workspace_memberships"("userId");
CREATE INDEX "workspace_memberships_workspaceId_role_idx" ON "workspace_memberships"("workspaceId", "role");

-- User.activeWorkspaceId (nullable in stage 1; set in stage 2 backfill)
ALTER TABLE "users" ADD COLUMN "activeWorkspaceId" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_activeWorkspaceId_fkey"
  FOREIGN KEY ("activeWorkspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL;
CREATE INDEX "users_activeWorkspaceId_idx" ON "users"("activeWorkspaceId");

-- Tag.workspaceId — already a String, drop the legacy default so backfill can write real FKs
ALTER TABLE "tags" ALTER COLUMN "workspaceId" DROP DEFAULT;

-- New workspaceId columns on every workspace-scoped table (nullable until backfill)
ALTER TABLE "time_entries" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "projects"     ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "clients"      ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "tasks"        ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "invitations"  ADD COLUMN "workspaceId" TEXT;

ALTER TABLE "invite_tokens" ADD COLUMN "workspaceId" TEXT;
CREATE INDEX "invite_tokens_workspaceId_idx" ON "invite_tokens"("workspaceId");
