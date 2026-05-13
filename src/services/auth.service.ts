import bcrypt from 'bcrypt'
import { OAuth2Client } from 'google-auth-library'
import * as userRepo from '@/repositories/user.repository'

export async function register(data: {
  name: string
  email: string
  password: string
  workspace: string
}) {
  const existing = await userRepo.findByEmail(data.email)
  if (existing) throw new Error('Email already in use')
  const hashed = await bcrypt.hash(data.password, 12)
  return userRepo.createUser({ ...data, password: hashed })
}

export async function login(email: string, password: string) {
  const user = await userRepo.findByEmail(email)
  if (!user || !user.password) throw new Error('Invalid credentials')
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new Error('Invalid credentials')
  return { id: user.id, name: user.name, email: user.email, workspace: user.workspace }
}

export async function googleAuth(idToken: string) {
  const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
  let payload
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    })
    payload = ticket.getPayload()
  } catch {
    throw new Error('Invalid Google token')
  }

  if (!payload) throw new Error('Invalid Google token')
  if (!payload.email_verified) throw new Error('Google account email is not verified.')

  const { sub: googleId, email, name, picture: avatarUrl } = payload

  const byGoogleId = await userRepo.findByGoogleId(googleId!)
  if (byGoogleId) return byGoogleId

  const byEmail = await userRepo.findByEmail(email!)
  if (byEmail) throw new Error('An account with this email already exists. Please sign in with your email and password.')

  return userRepo.createGoogleUser({
    googleId: googleId!,
    email: email!,
    name: name ?? email!,
    avatarUrl: avatarUrl ?? null,
  })
}

export async function getMe(userId: string) {
  return userRepo.findById(userId)
}

export async function updateMe(userId: string, data: { name?: string; workspace?: string }) {
  return userRepo.updateUser(userId, data)
}
