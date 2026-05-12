import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create demo user
  const password = await bcrypt.hash('password', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@trackflow.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'demo@trackflow.com',
      password,
      workspace: 'TrackFlow Demo',
    },
  })

  // Create projects
  const p1 = await prisma.project.create({ data: { name: 'Website Redesign', client: 'Acme Corp', color: '#4f8ef7', userId: user.id } })
  const p2 = await prisma.project.create({ data: { name: 'Mobile App', client: 'StartupXYZ', color: '#7c6fef', userId: user.id } })
  const p3 = await prisma.project.create({ data: { name: 'Internal Tools', color: '#34d399', userId: user.id } })

  // Create tags
  const t1 = await prisma.tag.create({ data: { name: 'billable', color: '#4f8ef7', userId: user.id } })
  const t2 = await prisma.tag.create({ data: { name: 'meeting', color: '#fbbf24', userId: user.id } })
  const t3 = await prisma.tag.create({ data: { name: 'dev', color: '#34d399', userId: user.id } })

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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
