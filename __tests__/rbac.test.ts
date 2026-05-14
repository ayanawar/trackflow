/**
 * RBAC tests — verifies Clockify-style access model with real JWT tokens.
 * Admin > Manager > Employee hierarchy.
 */
import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'

import { requireRole, signToken } from '@/lib/auth'

type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE'

async function req(role: Role) {
  const token = await signToken({ userId: 'uid', email: 'u@u.com', name: 'U', role })
  return new NextRequest('http://localhost/', {
    headers: { cookie: `tf_token=${token}` },
  })
}

const unauth = () => new NextRequest('http://localhost/')

// Admin guard
const adminOnly = requireRole(['ADMIN'])
// Manager+
const managerPlus = requireRole(['MANAGER', 'ADMIN'])
// All roles
const allRoles = requireRole(['EMPLOYEE', 'MANAGER', 'ADMIN'])

describe('Admin permissions', () => {
  it('Admin accesses admin-only route', async () => {
    expect(await adminOnly(await req('ADMIN'))).toBeNull()
  })
  it('Admin accesses manager-level route', async () => {
    expect(await managerPlus(await req('ADMIN'))).toBeNull()
  })
  it('Admin accesses employee-level route', async () => {
    expect(await allRoles(await req('ADMIN'))).toBeNull()
  })
})

describe('Manager permissions', () => {
  it('Manager blocked from admin-only route', async () => {
    expect((await adminOnly(await req('MANAGER')))?.status).toBe(403)
  })
  it('Manager accesses manager-level route', async () => {
    expect(await managerPlus(await req('MANAGER'))).toBeNull()
  })
  it('Manager accesses employee-level route', async () => {
    expect(await allRoles(await req('MANAGER'))).toBeNull()
  })
})

describe('Employee permissions', () => {
  it('Employee blocked from admin-only route', async () => {
    expect((await adminOnly(await req('EMPLOYEE')))?.status).toBe(403)
  })
  it('Employee blocked from manager route', async () => {
    expect((await managerPlus(await req('EMPLOYEE')))?.status).toBe(403)
  })
  it('Employee accesses own-data routes', async () => {
    expect(await allRoles(await req('EMPLOYEE'))).toBeNull()
  })
})

describe('Unauthenticated access', () => {
  it('Returns 401 for admin route', async () => {
    expect((await adminOnly(unauth()))?.status).toBe(401)
  })
  it('Returns 401 for manager route', async () => {
    expect((await managerPlus(unauth()))?.status).toBe(401)
  })
  it('Returns 401 for employee route', async () => {
    expect((await allRoles(unauth()))?.status).toBe(401)
  })
})
