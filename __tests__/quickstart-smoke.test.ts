import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const quickstart = readFileSync(
  join(process.cwd(), 'specs/007-auth-authorization-system/quickstart.md'),
  'utf8'
)

describe('auth authorization quickstart', () => {
  it('documents backend, browser, and docs verification paths', () => {
    expect(quickstart).toContain('bun run test')
    expect(quickstart).toContain('bun run build')
    expect(quickstart).toContain('/api/docs')
    expect(quickstart).toContain('/api/openapi.json')
    expect(quickstart).toContain('Unauthenticated visit to `/dashboard` redirects to `/auth/login`')
  })

  it('documents role-specific smoke expectations', () => {
    expect(quickstart).toContain('Admin can see Admin navigation')
    expect(quickstart).toContain('Manager sees assigned team/project/client/report controls only')
    expect(quickstart).toContain('Employee sees own tracking and assigned project/client controls only')
    expect(quickstart).toContain('Restricted UI does not flash while auth state is loading')
  })
})
