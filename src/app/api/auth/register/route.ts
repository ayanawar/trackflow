export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signToken, setTokenCookie } from '@/lib/auth'
import { registerSchema } from '@/lib/schemas'
import { created, badRequest, serverError } from '@/lib/response'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = registerSchema.safeParse(body)
    if (!result.success) return badRequest(result.error.issues[0].message)

    const { name, email, password, workspace } = result.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return badRequest('Email already in use')

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, workspace },
      select: { id: true, name: true, email: true, workspace: true, createdAt: true },
    })

    const token = await signToken({ userId: user.id, email: user.email, name: user.name })
    setTokenCookie(token)

    return created({ user, token })
  } catch (err) {
    console.error('[register]', err)
    return serverError()
  }
}
