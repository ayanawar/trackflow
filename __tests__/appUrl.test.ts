import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { buildAppUrl, getAppBaseUrl } from '@/lib/appUrl'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('app URL helpers', () => {
  it('uses the configured app URL when present', () => {
    vi.stubEnv('APP_URL', 'https://trackflow.example.com/')

    expect(getAppBaseUrl()).toBe('https://trackflow.example.com')
    expect(buildAppUrl('/auth/invite?token=abc')).toBe('https://trackflow.example.com/auth/invite?token=abc')
  })

  it('normalizes Vercel deployment URLs without a protocol', () => {
    vi.stubEnv('VERCEL_URL', 'trackflow-3jnc.vercel.app')

    expect(getAppBaseUrl()).toBe('https://trackflow-3jnc.vercel.app')
  })

  it('falls back to the request origin before localhost', () => {
    const req = new NextRequest('https://trackflow-3jnc.vercel.app/admin/users')

    expect(getAppBaseUrl(req)).toBe('https://trackflow-3jnc.vercel.app')
  })
})
