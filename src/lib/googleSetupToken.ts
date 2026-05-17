import { SignJWT, jwtVerify } from 'jose'

const INSECURE_DEFAULT = 'trackflow-secret-key-change-in-production'
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? INSECURE_DEFAULT)
const TTL_SECONDS = Number(process.env.GOOGLE_SETUP_TOKEN_TTL_SECONDS ?? 600)
const PURPOSE = 'google_signup'

export interface GoogleSetupPayload {
  googleId: string
  email: string
  name: string
  avatarUrl: string | null
}

export async function signSetupToken(payload: GoogleSetupPayload): Promise<string> {
  return new SignJWT({ ...payload, purpose: PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(SECRET)
}

export async function verifySetupToken(token: string): Promise<GoogleSetupPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    if (payload.purpose !== PURPOSE) return null
    const { googleId, email, name, avatarUrl } = payload as unknown as GoogleSetupPayload & {
      purpose: string
    }
    if (!googleId || !email || !name) return null
    return { googleId, email, name, avatarUrl: avatarUrl ?? null }
  } catch {
    return null
  }
}
