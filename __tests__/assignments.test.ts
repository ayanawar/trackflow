import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  teamMember: { findMany: vi.fn() },
  projectAssignment: { findFirst: vi.fn(), upsert: vi.fn(), findMany: vi.fn() },
  clientAssignment: { findFirst: vi.fn(), upsert: vi.fn(), findMany: vi.fn() },
  project: { findUnique: vi.fn() },
  client: { findUnique: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))

import { canAccessClient, canAccessProject } from '@/services/authorization.service'
import { assignClient, assignProject } from '@/services/assignment.service'

beforeEach(() => vi.clearAllMocks())

describe('assignment authorization', () => {
  it('allows Admin project access without assignment lookup', async () => {
    await expect(canAccessProject({ userId: 'admin', role: 'ADMIN' }, 'p1')).resolves.toBe(true)
    expect(prismaMock.project.findUnique).not.toHaveBeenCalled()
  })

  it('allows project owner access', async () => {
    prismaMock.project.findUnique.mockResolvedValue({ userId: 'owner' })
    await expect(canAccessProject({ userId: 'owner', role: 'EMPLOYEE' }, 'p1')).resolves.toBe(true)
  })

  it('allows assigned team project access', async () => {
    prismaMock.project.findUnique.mockResolvedValue({ userId: 'other' })
    prismaMock.teamMember.findMany.mockResolvedValue([{ teamId: 'team1' }])
    prismaMock.projectAssignment.findFirst.mockResolvedValue({ id: 'pa1' })
    await expect(canAccessProject({ userId: 'manager', role: 'MANAGER' }, 'p1')).resolves.toBe(true)
  })

  it('denies unassigned project access', async () => {
    prismaMock.project.findUnique.mockResolvedValue({ userId: 'other' })
    prismaMock.teamMember.findMany.mockResolvedValue([])
    prismaMock.projectAssignment.findFirst.mockResolvedValue(null)
    await expect(canAccessProject({ userId: 'employee', role: 'EMPLOYEE' }, 'p1')).resolves.toBe(false)
  })

  it('upserts direct project assignments', async () => {
    prismaMock.projectAssignment.upsert.mockResolvedValue({ id: 'pa1' })
    await assignProject('p1', { userId: 'u1', accessLevel: 'TRACK' })
    expect(prismaMock.projectAssignment.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { projectId_userId: { projectId: 'p1', userId: 'u1' } },
    }))
  })

  it('upserts team client assignments', async () => {
    prismaMock.clientAssignment.upsert.mockResolvedValue({ id: 'ca1' })
    await assignClient('c1', { teamId: 't1', accessLevel: 'REPORT' })
    expect(prismaMock.clientAssignment.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { clientId_teamId: { clientId: 'c1', teamId: 't1' } },
    }))
  })

  it('allows client creator access', async () => {
    prismaMock.client.findUnique.mockResolvedValue({ createdById: 'creator' })
    await expect(canAccessClient({ userId: 'creator', role: 'MANAGER' }, 'c1')).resolves.toBe(true)
  })
})
