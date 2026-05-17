import { describe, expect, it, beforeEach } from 'vitest'
import { signSetupToken, verifySetupToken } from '@/lib/googleSetupToken'
import { SignJWT } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'trackflow-secret-key-change-in-production',
)

describe('googleSetupToken', () => {
  const payload = {
    googleId: 'google-123',
    email: 'ada@example.com',
    name: 'Ada Lovelace',
    avatarUrl: 'https://example.com/ada.png',
  }

  it('round-trips a signed token', async () => {
    const token = await signSetupToken(payload)
    const decoded = await verifySetupToken(token)
    expect(decoded).toEqual(payload)
  })

  it('rejects a tampered token', async () => {
    const token = await signSetupToken(payload)
    const tampered = token.slice(0, -2) + 'aa'
    const decoded = await verifySetupToken(tampered)
    expect(decoded).toBeNull()
  })

  it('rejects an expired token', async () => {
    const expiredToken = await new SignJWT({ ...payload, purpose: 'google_signup' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(SECRET)
    const decoded = await verifySetupToken(expiredToken)
    expect(decoded).toBeNull()
  })

  it('rejects a token with wrong purpose', async () => {
    const wrongPurpose = await new SignJWT({ ...payload, purpose: 'something_else' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(SECRET)
    const decoded = await verifySetupToken(wrongPurpose)
    expect(decoded).toBeNull()
  })
})
