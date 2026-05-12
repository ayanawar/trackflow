export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signToken, setTokenCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/schemas'
import { ok, badRequest, unauthorized, serverError } from '@/lib/response'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = loginSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    const { email, password } = result.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return unauthorized('Invalid credentials')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return unauthorized('Invalid credentials')

    const token = await signToken({ userId: user.id, email: user.email, name: user.name })
    setTokenCookie(token)

    return ok({
      user: { id: user.id, name: user.name, email: user.email, workspace: user.workspace },
      token,
    })
  } catch (err) {
    console.error('[login]', err)
    return serverError()
  }
}
