#!/usr/bin/env tsx
/**
 * Verifies the org/workspace migration (specs/009-org-workspace-signup).
 * Run AFTER Stage 2 backfill and BEFORE Stage 3 finalize.
 *
 *   bun run scripts/verify-org-workspace-migration.ts            # quick checks
 *   bun run scripts/verify-org-workspace-migration.ts --sample 5 # sample N users for deep check
 *
 * Exits non-zero on any failure (blocks Stage 3 in CI).
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CheckResult {
  name: string
  passed: boolean
  detail: string
}

async function checkNullCount(table: string, column: string): Promise<CheckResult> {
  const rows: Array<{ count: bigint }> = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::bigint AS count FROM "${table}" WHERE "${column}" IS NULL`,
  )
  const count = Number(rows[0]?.count ?? 0)
  return {
    name: `${table}.${column} has zero nulls`,
    passed: count === 0,
    detail: `count=${count}`,
  }
}

async function deepSampleCheck(sampleSize: number): Promise<CheckResult[]> {
  const sampleUsers = await prisma.user.findMany({
    take: sampleSize,
    orderBy: { id: 'asc' },
    select: { id: true, email: true, activeWorkspaceId: true },
  })
  const results: CheckResult[] = []
  for (const u of sampleUsers) {
    if (!u.activeWorkspaceId) {
      results.push({
        name: `user ${u.email} has activeWorkspaceId`,
        passed: false,
        detail: 'null',
      })
      continue
    }
    const tags = await prisma.tag.count({ where: { userId: u.id } })
    const tagsInWs = await prisma.tag.count({
      where: { userId: u.id, workspaceId: u.activeWorkspaceId },
    })
    results.push({
      name: `user ${u.email} tags fully scoped`,
      passed: tags === tagsInWs,
      detail: `total=${tags} scoped=${tagsInWs}`,
    })
    const tes = await prisma.timeEntry.count({ where: { userId: u.id } })
    const tesInWs = await prisma.timeEntry.count({
      where: { userId: u.id, workspaceId: u.activeWorkspaceId },
    })
    results.push({
      name: `user ${u.email} time entries fully scoped`,
      passed: tes === tesInWs,
      detail: `total=${tes} scoped=${tesInWs}`,
    })
  }
  return results
}

async function main() {
  const args = process.argv.slice(2)
  const sampleArg = args.find((a, i) => a === '--sample')
  const sampleSize = sampleArg ? Number(args[args.indexOf('--sample') + 1] ?? 0) : 0

  const checks: CheckResult[] = []
  checks.push(await checkNullCount('users', 'activeWorkspaceId'))
  checks.push(await checkNullCount('tags', 'workspaceId'))
  checks.push(await checkNullCount('time_entries', 'workspaceId'))
  checks.push(await checkNullCount('projects', 'workspaceId'))
  checks.push(await checkNullCount('clients', 'workspaceId'))
  checks.push(await checkNullCount('tasks', 'workspaceId'))
  checks.push(await checkNullCount('invitations', 'workspaceId'))

  if (sampleSize > 0) {
    checks.push(...(await deepSampleCheck(sampleSize)))
  }

  const failed = checks.filter(c => !c.passed)
  for (const c of checks) {
    const mark = c.passed ? '✓' : '✗'
    console.log(`${mark} ${c.name}  (${c.detail})`)
  }
  console.log()
  if (failed.length > 0) {
    console.error(`FAIL — ${failed.length} of ${checks.length} checks failed.`)
    process.exit(1)
  }
  console.log(`PASS — ${checks.length} of ${checks.length} checks passed.`)
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
