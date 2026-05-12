import bcrypt from 'bcryptjs'
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
  if (!user) throw new Error('Invalid credentials')
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new Error('Invalid credentials')
  return { id: user.id, name: user.name, email: user.email, workspace: user.workspace }
}

export async function getMe(userId: string) {
  return userRepo.findById(userId)
}

export async function updateMe(userId: string, data: { name?: string; workspace?: string }) {
  return userRepo.updateUser(userId, data)
}
