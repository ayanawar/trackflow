import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const normalizeTagName = (name: string) => name.trim().replace(/\s+/g, ' ')
const tagKey = (name: string) => normalizeTagName(name).toLocaleLowerCase()

async function main() {
  console.log('Seeding database...')

  const password = await bcrypt.hash('password', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@trackflow.com' },
    update: { role: 'ADMIN' },
    create: {
      name: 'John Doe',
      email: 'demo@trackflow.com',
      password,
      workspace: 'TrackFlow Demo',
      role: 'ADMIN',
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@trackflow.com' },
    update: { role: 'MANAGER' },
    create: {
      name: 'Mary Manager',
      email: 'manager@trackflow.com',
      password,
      workspace: 'TrackFlow Demo',
      role: 'MANAGER',
    },
  })

  const employee = await prisma.user.upsert({
    where: { email: 'employee@trackflow.com' },
    update: { role: 'EMPLOYEE' },
    create: {
      name: 'Evan Employee',
      email: 'employee@trackflow.com',
      password,
      workspace: 'TrackFlow Demo',
      role: 'EMPLOYEE',
    },
  })

  const unassigned = await prisma.user.upsert({
    where: { email: 'unassigned@trackflow.com' },
    update: { role: 'EMPLOYEE' },
    create: {
      name: 'Una Unassigned',
      email: 'unassigned@trackflow.com',
      password,
      workspace: 'TrackFlow Demo',
      role: 'EMPLOYEE',
    },
  })

  const acme = await prisma.client.findFirst({ where: { name: 'Acme Corp', createdById: user.id } })
    ?? await prisma.client.create({ data: { name: 'Acme Corp', description: 'Primary demo client', createdById: user.id } })

  const startup = await prisma.client.findFirst({ where: { name: 'StartupXYZ', createdById: user.id } })
    ?? await prisma.client.create({ data: { name: 'StartupXYZ', description: 'Mobile app client', createdById: user.id } })

  const team = await prisma.team.findFirst({ where: { name: 'Demo Team', createdById: user.id } })
    ?? await prisma.team.create({ data: { name: 'Demo Team', description: 'Demo manager and employee team', createdById: user.id } })

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

  // Create projects
  const p1 = await prisma.project.create({ data: { name: 'Website Redesign', client: 'Acme Corp', clientId: acme.id, color: '#4f8ef7', userId: user.id } })
  const p2 = await prisma.project.create({ data: { name: 'Mobile App', client: 'StartupXYZ', clientId: startup.id, color: '#7c6fef', userId: user.id } })
  const p3 = await prisma.project.create({ data: { name: 'Internal Tools', color: '#34d399', userId: user.id } })

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

  // Create shared workspace tags
  const workspaceId = user.activeOrgId ? `org:${user.activeOrgId}` : `workspace:${user.workspace}`
  const upsertTag = (name: string, color: string) => prisma.tag.upsert({
    where: { workspaceId_normalizedName: { workspaceId, normalizedName: tagKey(name) } },
    update: { name: normalizeTagName(name), color, status: 'ACTIVE', updatedById: user.id },
    create: {
      name: normalizeTagName(name),
      normalizedName: tagKey(name),
      color,
      workspaceId,
      status: 'ACTIVE',
      userId: user.id,
      updatedById: user.id,
    },
  })
  const t1 = await upsertTag('billable', '#4f8ef7')
  const t2 = await upsertTag('meeting', '#fbbf24')
  const t3 = await upsertTag('dev', '#34d399')

  // Create time entries
  const now = new Date()
  const entries = [
    { description: 'Homepage layout design', projectId: p1.id, tagId: t1.id, hoursAgo: 26, dur: 9000 },
    { description: 'Client call – Q3 planning', projectId: p1.id, tagId: t2.id, hoursAgo: 24, dur: 1800 },
    { description: 'API integration', projectId: p2.id, tagId: t3.id, hoursAgo: 50, dur: 14400 },
    { description: 'Code review & testing', projectId: p2.id, tagId: t3.id, hoursAgo: 46, dur: 3600 },
    { description: 'Dashboard analytics setup', projectId: p3.id, tagId: t3.id, hoursAgo: 74, dur: 9000 },
    { description: 'Team standup', projectId: null, tagId: t2.id, hoursAgo: 2, dur: 1800 },
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
        userId: user.id,
        startTime: start,
        endTime: end,
        duration: e.dur,
        isRunning: false,
      },
    })
  }

  console.log('✅ Seeded successfully!')
  console.log('   Login: demo@trackflow.com / password')
  console.log('   Login: manager@trackflow.com / password')
  console.log('   Login: employee@trackflow.com / password')
  console.log('   Login: unassigned@trackflow.com / password')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
