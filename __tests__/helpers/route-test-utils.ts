import { NextRequest } from 'next/server'
import { signToken } from '@/lib/auth'
import type { Role } from '@/types'

export async function requestWithRole(
  url: string,
  role: Role,
  init: RequestInit = {},
  userId = 'user_1'
) {
  const token = await signToken({
    userId,
    email: `${role.toLowerCase()}@trackflow.test`,
    name: `${role} User`,
    role,
  })
  const headers = new Headers(init.headers)
  headers.set('cookie', `tf_token=${token}`)
  return new NextRequest(url, { ...init, headers })
}

export function jsonRequest(url: string, body: unknown, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json')
  return new NextRequest(url, {
    ...init,
    method: init.method ?? 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

export async function responseJson<T = any>(response: Response): Promise<T> {
  return response.json() as Promise<T>
}
