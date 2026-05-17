import { randomBytes } from 'crypto'
import prisma from '@/lib/prisma'
import { workspaceNormalizedName } from './workspace.repository'

export async function findOrgsByUser(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  })
}

export async function findOrgById(id: string) {
  return prisma.organization.findUnique({
    where: { id },
    include: {
      memberships: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
      teams: { include: { members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } } } },
      workspaces: true,
    },
  })
}

export async function findOrgBySlug(slug: string) {
  return prisma.organization.findUnique({ where: { slug } })
}

export async function createOrg(data: { name: string; slug: string; avatarUrl?: string | null }) {
  return prisma.organization.create({ data })
}

export async function updateOrg(id: string, data: { name?: string; avatarUrl?: string | null }) {
  return prisma.organization.update({ where: { id }, data })
}

export async function deleteOrg(id: string) {
  return prisma.organization.delete({ where: { id } })
}

export async function findMembership(userId: string, orgId: string) {
  return prisma.membership.findUnique({ where: { userId_orgId: { userId, orgId } } })
}

export async function createMembership(userId: string, orgId: string, role: string) {
  return prisma.membership.create({ data: { userId, orgId, role } })
}

export async function updateMembership(userId: string, orgId: string, role: string) {
  return prisma.membership.update({ where: { userId_orgId: { userId, orgId } }, data: { role } })
}

export async function deleteMembership(userId: string, orgId: string) {
  return prisma.membership.delete({ where: { userId_orgId: { userId, orgId } } })
}

export async function setActiveOrg(userId: string, activeOrgId: string | null) {
  return prisma.user.update({ where: { id: userId }, data: { activeOrgId } })
}

function slugify(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'org'
  const suffix = randomBytes(2).toString('hex') // 4 chars
  return `${base}-${suffix}`
}

/**
 * Atomically create a fresh Organization with the given owner user, plus a
 * first Workspace inside that organization with the owner as workspace ADMIN.
 * Slug is generated from the name with a 4-char random suffix on collision.
 * Returns { orgId, workspaceId }.
 */
export async function createWithOwnerAndWorkspace(params: {
  orgName: string
  workspaceName: string
  ownerUserId: string
}): Promise<{ orgId: string; workspaceId: string }> {
  const orgName = params.orgName.trim()
  const workspaceName = params.workspaceName.trim()

  // Retry once on slug collision (extremely rare with random suffix).
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const slug = slugify(orgName)
      const { orgId, workspaceId } = await prisma.$transaction(async tx => {
        const org = await tx.organization.create({ data: { name: orgName, slug } })
        await tx.membership.create({
          data: { userId: params.ownerUserId, orgId: org.id, role: 'OWNER' },
        })
        const ws = await tx.workspace.create({
          data: {
            orgId: org.id,
            name: workspaceName,
            normalizedName: workspaceNormalizedName(workspaceName),
            createdById: params.ownerUserId,
          },
        })
        await tx.workspaceMembership.create({
          data: { workspaceId: ws.id, userId: params.ownerUserId, role: 'ADMIN' },
        })
        return { orgId: org.id, workspaceId: ws.id }
      })
      return { orgId, workspaceId }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('Unique constraint') && message.includes('slug')) continue
      throw err
    }
  }
  throw new Error('Could not generate a unique organization slug')
}
