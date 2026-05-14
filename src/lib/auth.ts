import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { forbidden, unauthorized } from '@/lib/response'
import { canAccessClient, canAccessProject } from '@/services/authorization.service'
import type { Role } from '@/types'

const INSECURE_DEFAULT = 'trackflow-secret-key-change-in-production'
const rawSecret = process.env.JWT_SECRET

if (!rawSecret || rawSecret === INSECURE_DEFAULT) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is not set or uses the insecure default. Set a strong secret before deploying.')
  } else {
    console.warn('[auth] JWT_SECRET is not set or uses the insecure default. Set JWT_SECRET in .env.local.')
  }
}

const JWT_SECRET = new TextEncoder().encode(rawSecret ?? INSECURE_DEFAULT)
const COOKIE_NAME = 'tf_token'
const REFRESH_COOKIE_NAME = 'tf_refresh'

export interface JWTPayload {
  userId: string
  email: string
  name: string
  role: Role
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getSessionUser(): Promise<JWTPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getSessionFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const token =
    req.cookies.get(COOKIE_NAME)?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

export function setTokenCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15, // 15 minutes
    path: '/',
  })
}

export function clearTokenCookie() {
  cookies().set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
}

export function setRefreshCookie(token: string) {
  cookies().set(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
}

export function clearRefreshCookie() {
  cookies().set(REFRESH_COOKIE_NAME, '', { maxAge: 0, path: '/' })
}

export function getRefreshFromRequest(req: NextRequest): string | null {
  return req.cookies.get(REFRESH_COOKIE_NAME)?.value ?? null
}

export function requireRole(roles: string[]) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    if (!roles.includes(session.role)) return forbidden()
    return null
  }
}

export function requireProjectAccess(
  getProjectId: (req: NextRequest) => string | null,
  levels?: string[]
) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const projectId = getProjectId(req)
    if (!projectId) return forbidden()
    const allowed = await canAccessProject({ userId: session.userId, role: session.role }, projectId, levels)
    if (!allowed) return forbidden()
    return null
  }
}

export function requireClientAccess(
  getClientId: (req: NextRequest) => string | null,
  levels?: string[]
) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()
    const clientId = getClientId(req)
    if (!clientId) return forbidden()
    const allowed = await canAccessClient({ userId: session.userId, role: session.role }, clientId, levels)
    if (!allowed) return forbidden()
    return null
  }
}

export { COOKIE_NAME, REFRESH_COOKIE_NAME }
