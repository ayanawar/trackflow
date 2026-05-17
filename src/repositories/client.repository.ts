import prisma from '@/lib/prisma'

export async function findAllByWorkspace(workspaceId: string) {
  return prisma.client.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { projects: true, clientAssignments: true } } },
  })
}

export async function findAll() {
  // workspace-scope-exempt: legacy helper retained for org-wide admin reporting;
  // route layer must layer workspace filtering on top before exposing data.
  return prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { projects: true, clientAssignments: true } } },
  })
}

export async function findById(id: string, workspaceId?: string) {
  if (workspaceId) {
    return prisma.client.findFirst({ where: { id, workspaceId } })
  }
  return prisma.client.findUnique({ where: { id } })
}

export async function create(data: {
  name: string
  description?: string | null
  workspaceId: string
  createdById: string
}) {
  return prisma.client.create({ data })
}

export async function update(id: string, workspaceId: string, data: { name?: string; description?: string | null }) {
  return prisma.client.update({ where: { id, workspaceId }, data })
}
