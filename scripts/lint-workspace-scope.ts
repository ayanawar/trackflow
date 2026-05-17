#!/usr/bin/env bun
/**
 * Lint check that grep's the repositories directory for Prisma calls to
 * workspace-scoped models that don't include `workspaceId` in their where/data
 * clause.
 *
 * Run via `bun run scripts/lint-workspace-scope.ts`. Exit non-zero on offence.
 */
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

const REPO_DIR = join(process.cwd(), 'src', 'repositories')
const WORKSPACE_SCOPED_MODELS = [
  'tag',
  'timeEntry',
  'project',
  'client',
  'task',
  'workspace',
  'workspaceMembership',
  'invitation',
]

// Calls like prisma.tag.findMany(...). We then ensure the call's argument
// includes 'workspaceId' somewhere — naive grep, but catches the common case.
const CALL_PATTERN = new RegExp(
  `prisma\\.(${WORKSPACE_SCOPED_MODELS.join('|')})\\.(findMany|findFirst|findUnique|update|updateMany|delete|deleteMany|count|aggregate|groupBy|create|createMany|upsert)\\b`,
  'g',
)

const offences: { file: string; line: number; snippet: string }[] = []

function walk(dir: string): string[] {
  let out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      out = out.concat(walk(full))
    } else if (entry.endsWith('.ts')) {
      out.push(full)
    }
  }
  return out
}

function check(file: string) {
  const src = readFileSync(file, 'utf8')
  const lines = src.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes('// workspace-scope-exempt')) continue
    const matches = Array.from(line.matchAll(CALL_PATTERN))
    if (matches.length === 0) continue
    // Window nearby lines to catch function parameters and explicit preflight guards
    // immediately before a single-column update/delete by id.
    const window = lines.slice(Math.max(0, i - 8), Math.min(i + 24, lines.length)).join('\n')
    if (!window.includes('workspaceId')) {
      offences.push({ file, line: i + 1, snippet: line.trim() })
    }
  }
}

const files = walk(REPO_DIR)
for (const f of files) check(f)

if (offences.length > 0) {
  console.error('\n[lint-workspace-scope] Found unscoped Prisma calls:\n')
  for (const o of offences) {
    console.error(`  ${o.file}:${o.line}  ${o.snippet}`)
  }
  console.error(
    '\nEvery Prisma call to a workspace-scoped model must filter by workspaceId.',
  )
  console.error(
    'If a call is intentionally cross-workspace (e.g., a system-level reaper),',
  )
  console.error('add `// workspace-scope-exempt: <reason>` on the same line.\n')
  process.exit(1)
}

console.log('[lint-workspace-scope] OK — all workspace-scoped calls are scoped.')
