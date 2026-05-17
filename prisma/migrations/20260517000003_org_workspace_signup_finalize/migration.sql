-- Stage 3 of 3 — Enforce NOT NULL on the backfilled columns and drop the
-- legacy `users.workspace` string. Run only after Stage 2 backfill + the
-- verify-org-workspace-migration.ts script pass with zero nulls.

ALTER TABLE "users"        ALTER COLUMN "activeWorkspaceId" SET NOT NULL;
ALTER TABLE "tags"         ALTER COLUMN "workspaceId"       SET NOT NULL;
ALTER TABLE "time_entries" ALTER COLUMN "workspaceId"       SET NOT NULL;
ALTER TABLE "projects"     ALTER COLUMN "workspaceId"       SET NOT NULL;
ALTER TABLE "clients"      ALTER COLUMN "workspaceId"       SET NOT NULL;
ALTER TABLE "tasks"        ALTER COLUMN "workspaceId"       SET NOT NULL;
ALTER TABLE "invitations"  ALTER COLUMN "workspaceId"       SET NOT NULL;

-- Add the now-required FK constraints for the backfilled columns.
ALTER TABLE "tags"         ADD CONSTRAINT "tags_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE;
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE;
ALTER TABLE "projects"     ADD CONSTRAINT "projects_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE;
ALTER TABLE "clients"      ADD CONSTRAINT "clients_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE;
ALTER TABLE "tasks"        ADD CONSTRAINT "tasks_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE;
ALTER TABLE "invitations"  ADD CONSTRAINT "invitations_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "time_entries_workspaceId_startTime_idx"
  ON "time_entries"("workspaceId", "startTime");
CREATE INDEX IF NOT EXISTS "projects_workspaceId_idx"     ON "projects"("workspaceId");
CREATE INDEX IF NOT EXISTS "clients_workspaceId_idx"      ON "clients"("workspaceId");
CREATE INDEX IF NOT EXISTS "tasks_workspaceId_status_idx" ON "tasks"("workspaceId", "status");
CREATE INDEX IF NOT EXISTS "invitations_workspaceId_idx"  ON "invitations"("workspaceId");

-- Drop the legacy per-user string column.
ALTER TABLE "users" DROP COLUMN "workspace";
