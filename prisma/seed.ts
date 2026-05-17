import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const normalizeTagName = (name: string) => name.trim().replace(/\s+/g, ' ')
const tagKey = (name: string) => normalizeTagName(name).toLocaleLowerCase()
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const workspaceKey = (name: string) => name.trim().toLowerCase()

async function main() {
  console.log('Seeding database...')

  const password = await bcrypt.hash('password', 12)

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'trackflow-demo' },
    update: {},
    create: { name: 'TrackFlow Demo', slug: 'trackflow-demo' },
  })

  // 2. Users
  const user = await prisma.user.upsert({
    where: { email: 'demo@trackflow.com' },
    update: { role: 'ADMIN' },
    create: {
      name: 'John Doe',
      email: 'demo@trackflow.com',
      password,
      role: 'ADMIN',
    },
  })
  const manager = await prisma.user.upsert({
    where: { email: 'manager@trackflow.com' },
    update: { role: 'MANAGER' },
    create: { name: 'Mary Manager', email: 'manager@trackflow.com', password, role: 'MANAGER' },
  })
  const employee = await prisma.user.upsert({
    where: { email: 'employee@trackflow.com' },
    update: { role: 'EMPLOYEE' },
    create: { name: 'Evan Employee', email: 'employee@trackflow.com', password, role: 'EMPLOYEE' },
  })
  const unassigned = await prisma.user.upsert({
    where: { email: 'unassigned@trackflow.com' },
    update: { role: 'EMPLOYEE' },
    create: { name: 'Una Unassigned', email: 'unassigned@trackflow.com', password, role: 'EMPLOYEE' },
  })

  // 3. Org memberships
  for (const [u, role] of [
    [user, 'OWNER'],
    [manager, 'ADMIN'],
    [employee, 'MEMBER'],
    [unassigned, 'MEMBER'],
  ] as const) {
    await prisma.membership.upsert({
      where: { userId_orgId: { userId: u.id, orgId: org.id } },
      update: { role },
      create: { userId: u.id, orgId: org.id, role },
    })
  }

  // 4. Two workspaces under the same org (for multi-workspace isolation testing)
  const wsMain = await prisma.workspace.upsert({
    where: { orgId_normalizedName: { orgId: org.id, normalizedName: workspaceKey('Main') } },
    update: {},
    create: {
      orgId: org.id,
      name: 'Main',
      normalizedName: workspaceKey('Main'),
      createdById: user.id,
    },
  })
  const wsRnd = await prisma.workspace.upsert({
    where: { orgId_normalizedName: { orgId: org.id, normalizedName: workspaceKey('R&D') } },
    update: {},
    create: {
      orgId: org.id,
      name: 'R&D',
      normalizedName: workspaceKey('R&D'),
      createdById: user.id,
    },
  })

  // 5. Workspace memberships — everyone in Main; only user in R&D (isolation test)
  for (const [u, role] of [
    [user, 'ADMIN'],
    [manager, 'ADMIN'],
    [employee, 'MEMBER'],
    [unassigned, 'MEMBER'],
  ] as const) {
    await prisma.workspaceMembership.upsert({
      where: { workspaceId_userId: { workspaceId: wsMain.id, userId: u.id } },
      update: { role },
      create: { workspaceId: wsMain.id, userId: u.id, role },
    })
  }
  await prisma.workspaceMembership.upsert({
    where: { workspaceId_userId: { workspaceId: wsRnd.id, userId: user.id } },
    update: { role: 'ADMIN' },
    create: { workspaceId: wsRnd.id, userId: user.id, role: 'ADMIN' },
  })

  // 6. Active workspace per user
  for (const u of [user, manager, employee, unassigned]) {
    await prisma.user.update({
      where: { id: u.id },
      data: { activeWorkspaceId: wsMain.id, activeOrgId: org.id },
    })
  }

  // 7. Clients (Main workspace)
  const acme = await prisma.client.findFirst({ where: { name: 'Acme Corp', workspaceId: wsMain.id } })
    ?? await prisma.client.create({
      data: { name: 'Acme Corp', description: 'Primary demo client', workspaceId: wsMain.id, createdById: user.id },
    })
  const startup = await prisma.client.findFirst({ where: { name: 'StartupXYZ', workspaceId: wsMain.id } })
    ?? await prisma.client.create({
      data: { name: 'StartupXYZ', description: 'Mobile app client', workspaceId: wsMain.id, createdById: user.id },
    })

  // 8. Team
  const team = await prisma.team.findFirst({ where: { name: 'Demo Team', createdById: user.id } })
    ?? await prisma.team.create({
      data: { name: 'Demo Team', description: 'Demo manager and employee team', orgId: org.id, createdById: user.id },
    })
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: manager.id } },
    update: { memberRole: 'MANAGER' },
    create: { teamId: team.id, userId: manager.id, memberRole: 'MANAGER' },
  })
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: employee.id } },
    update: { memberRole: 'MEMBER' },
    create: { teamId: team.id, userId: employee.id, memberRole: 'MEMBER' },
  })

  // 9. Projects (Main workspace)
  const p1 = await prisma.project.create({ data: { name: 'Website Redesign', client: 'Acme Corp', clientId: acme.id, color: '#4f8ef7', workspaceId: wsMain.id, userId: user.id } })
  const p2 = await prisma.project.create({ data: { name: 'Mobile App', client: 'StartupXYZ', clientId: startup.id, color: '#7c6fef', workspaceId: wsMain.id, userId: user.id } })
  const p3 = await prisma.project.create({ data: { name: 'Internal Tools', color: '#34d399', workspaceId: wsMain.id, userId: user.id } })

  // 10. R&D workspace gets one isolated project + client so isolation tests have data
  const rndClient = await prisma.client.create({
    data: { name: 'R&D Internal', description: 'Skunkworks', workspaceId: wsRnd.id, createdById: user.id },
  })
  await prisma.project.create({
    data: { name: 'Skunkworks Prototype', color: '#f472b6', workspaceId: wsRnd.id, userId: user.id, clientId: rndClient.id },
  })

  // 11. Project + client assignments
  for (const project of [p1, p2]) {
    await prisma.projectAssignment.upsert({
      where: { projectId_teamId: { projectId: project.id, teamId: team.id } },
      update: { accessLevel: 'TRACK' },
      create: { projectId: project.id, teamId: team.id, accessLevel: 'TRACK' },
    })
  }
  await prisma.clientAssignment.upsert({
    where: { clientId_teamId: { clientId: acme.id, teamId: team.id } },
    update: { accessLevel: 'REPORT' },
    create: { clientId: acme.id, teamId: team.id, accessLevel: 'REPORT' },
  })

  // 12. Tags (Main workspace)
  const upsertTag = (name: string, color: string) => prisma.tag.upsert({
    where: { workspaceId_normalizedName: { workspaceId: wsMain.id, normalizedName: tagKey(name) } },
    update: { name: normalizeTagName(name), color, status: 'ACTIVE', updatedById: user.id },
    create: {
      name: normalizeTagName(name),
      normalizedName: tagKey(name),
      color,
      workspaceId: wsMain.id,
      status: 'ACTIVE',
      userId: user.id,
      updatedById: user.id,
    },
  })
  const t1 = await upsertTag('billable', '#4f8ef7')
  const t2 = await upsertTag('meeting', '#fbbf24')
  const t3 = await upsertTag('dev', '#34d399')

  // 13. Time entries (Main workspace)
  const now = new Date()
  const entries = [
    { description: 'Homepage layout design', projectId: p1.id, tagId: t1.id, hoursAgo: 26, dur: 9000 },
    { description: 'Client call – Q3 planning', projectId: p1.id, tagId: t2.id, hoursAgo: 24, dur: 1800 },
    { description: 'API integration', projectId: p2.id, tagId: t3.id, hoursAgo: 50, dur: 14400 },
    { description: 'Code review & testing', projectId: p2.id, tagId: t3.id, hoursAgo: 46, dur: 3600 },
    { description: 'Dashboard analytics setup', projectId: p3.id, tagId: t3.id, hoursAgo: 74, dur: 9000 },
    { description: 'Team standup', projectId: null as string | null, tagId: t2.id, hoursAgo: 2, dur: 1800 },
    { description: 'Feature spec writing', projectId: p1.id, tagId: t1.id, hoursAgo: 1.5, dur: 3600 },
  ]

  for (const e of entries) {
    const start = new Date(now.getTime() - e.hoursAgo * 3600000)
    const end = new Date(start.getTime() + e.dur * 1000)
    await prisma.timeEntry.create({
      data: {
        description: e.description,
        projectId: e.projectId,
        tagId: e.tagId,
        workspaceId: wsMain.id,
        userId: user.id,
        startTime: start,
        endTime: end,
        duration: e.dur,
        isRunning: false,
      },
    })
  }

  console.log('✅ Seeded successfully!')
  console.log(`   Org:        ${org.name}  (${org.id})`)
  console.log(`   Workspaces: Main (${wsMain.id})  +  R&D (${wsRnd.id})`)
  console.log('   Login: demo@trackflow.com / password (ADMIN, both workspaces)')
  console.log('   Login: manager@trackflow.com / password (MANAGER, Main only)')
  console.log('   Login: employee@trackflow.com / password (EMPLOYEE, Main only)')
  console.log('   Login: unassigned@trackflow.com / password (EMPLOYEE, Main only)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
