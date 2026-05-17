import prisma from '@/lib/prisma'

const normalizeName = (s: string) => s.trim().toLowerCase()
export const workspaceNormalizedName = normalizeName

export async function findById(id: string) {
  return prisma.workspace.findUnique({ where: { id } }) // workspace-scope-exempt: workspace repository root lookup
}

export async function findByOrgAndNormalizedName(orgId: string, normalizedName: string) {
  return prisma.workspace.findUnique({ // workspace-scope-exempt: workspace repository uniqueness lookup
    where: { orgId_normalizedName: { orgId, normalizedName } },
  })
}

export async function create(data: {
  orgId: string
  name: string
  createdById: string
}) {
  return prisma.workspace.create({ // workspace-scope-exempt: creating workspace root row
    data: {
      orgId: data.orgId,
      name: data.name.trim(),
      normalizedName: normalizeName(data.name),
      createdById: data.createdById,
    },
  })
}

/**
 * Workspaces the user can see — every workspace they have a WorkspaceMembership for,
 * PLUS every workspace under an org where they have an org-level ADMIN/OWNER role
 * (so org admins can administer all sibling workspaces).
 */
export async function listForUser(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    select: { orgId: true, role: true },
  })
  const adminOrgIds = memberships
    .filter(m => m.role === 'OWNER' || m.role === 'ADMIN')
    .map(m => m.orgId)

  const workspaces = await prisma.workspace.findMany({ // workspace-scope-exempt: listing reachable workspace roots
    where: {
      OR: [
        { memberships: { some: { userId } } },
        ...(adminOrgIds.length > 0 ? [{ orgId: { in: adminOrgIds } }] : []),
      ],
    },
    include: {
      memberships: { where: { userId }, select: { role: true } },
      _count: { select: { memberships: true } },
    },
    orderBy: [{ orgId: 'asc' }, { createdAt: 'asc' }],
  })

  const adminOrgSet = new Set(adminOrgIds)
  return workspaces.map(w => ({
    id: w.id,
    orgId: w.orgId,
    name: w.name,
    createdAt: w.createdAt,
    role: (w.memberships[0]?.role ?? (adminOrgSet.has(w.orgId) ? 'ADMIN' : 'MEMBER')) as
      | 'ADMIN'
      | 'MEMBER',
    memberCount: w._count.memberships,
  }))
}

export async function listAdminableForUser(userId: string) {
  const all = await listForUser(userId)
  return all.filter(w => w.role === 'ADMIN')
}

export async function listAccessibleIdsForUser(userId: string): Promise<string[]> {
  const all = await listForUser(userId)
  return all.map(w => w.id)
}

export async function isMember(workspaceId: string, userId: string) {
  const direct = await prisma.workspaceMembership.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  })
  if (direct) return direct.role
  // Org owner/admin implicit access
  const ws = await prisma.workspace.findUnique({ // workspace-scope-exempt: workspace repository membership lookup
    where: { id: workspaceId },
    select: { orgId: true },
  })
  if (!ws) return null
  const m = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId: ws.orgId } },
    select: { role: true },
  })
  if (m && (m.role === 'OWNER' || m.role === 'ADMIN')) return 'ADMIN'
  return null
}

export async function update(
  id: string,
  data: { name?: string }
) {
  return prisma.workspace.update({ // workspace-scope-exempt: updating workspace root row
    where: { id },
    data: {
      ...(data.name !== undefined && {
        name: data.name.trim(),
        normalizedName: normalizeName(data.name),
      }),
    },
  })
}

export async function deleteCascade(id: string) {
  return prisma.workspace.delete({ where: { id } }) // workspace-scope-exempt: deleting workspace root row
}
