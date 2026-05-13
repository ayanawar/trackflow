# Developer Quickstart: Clean Code Architecture

**Branch**: `003-clean-code-arch` | **Date**: 2026-05-13

This guide explains how to work with the refactored architecture after this sprint completes.

---

## New Directory Layout

```
src/
├── app/
│   └── api/
│       ├── auth/login, register, me, logout  ← thin handlers, call auth.service
│       ├── projects/[id]/                    ← thin handlers, call project.service
│       ├── time-entries/[id]/stop/           ← thin handlers, call timeEntry.service
│       ├── stats/                            ← thin handler, calls stats.service
│       ├── tags/[id]/                        ← thin handlers, call tag via timeEntry.service
│       └── insights/                         ← NEW: POST proxy to Anthropic
├── repositories/
│   ├── user.repository.ts
│   ├── project.repository.ts
│   ├── timeEntry.repository.ts
│   └── tag.repository.ts
├── services/
│   ├── auth.service.ts
│   ├── project.service.ts
│   ├── timeEntry.service.ts
│   ├── stats.service.ts
│   └── insights.service.ts
├── hooks/
│   ├── useProjects.ts
│   ├── useTimeEntries.ts
│   ├── useStats.ts
│   └── useTags.ts
├── components/
│   ├── tracker/
│   │   ├── TimerBar.tsx          ← tag input replaced with <TagInput>
│   │   └── TagInput.tsx          ← NEW: inline tag picker
│   └── ui/
│       └── SafeMarkdown.tsx      ← NEW: replaces dangerouslySetInnerHTML
└── lib/
    ├── auth.ts                   ← JWT_SECRET guard added
    ├── authStore.ts              ← logout no longer navigates
    ├── rateLimit.ts              ← NEW: sliding window rate limiter
    └── schemas.ts                ← updateUserSchema + aiQuerySchema added
```

---

## Environment Variables Required

```bash
DATABASE_URL=postgresql://...      # Required always
JWT_SECRET=<random-64-char-string> # Required — app warns in dev, throws in prod if missing
ANTHROPIC_API_KEY=sk-ant-...       # Required for AI Insights feature
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Adding a New API Route

1. **Define the schema** in `src/lib/schemas.ts`:
   ```ts
   export const myThingSchema = z.object({ ... })
   ```

2. **Add repository function** in `src/repositories/myThing.repository.ts`:
   ```ts
   export async function createMyThing(data: {...}) { return prisma.myThing.create({...}) }
   ```

3. **Add service function** in `src/services/myThing.service.ts`:
   ```ts
   export async function createMyThing(userId: string, input: {...}) {
     // business rules here
     return myThingRepository.create({ ...input, userId })
   }
   ```

4. **Write the thin route handler** in `src/app/api/my-thing/route.ts`:
   ```ts
   export async function POST(req: NextRequest) {
     const session = await getSessionFromRequest(req)
     if (!session) return unauthorized()
     const body = await req.json()
     const result = myThingSchema.safeParse(body)
     if (!result.success) return badRequest(result.error.issues[0].message)
     const thing = await createMyThing(session.userId, result.data)
     return created(thing)
   }
   ```

5. **Add a custom hook** in `src/hooks/useMyThing.ts` for frontend consumption.

---

## Using Custom Hooks in a Page

```tsx
// Before (duplicated inline):
const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: () => api.get('/projects').then(r => r.data) })

// After (shared hook):
import { useProjects } from '@/hooks/useProjects'
const { data: projects } = useProjects()
```

---

## Adding a New Custom Hook

```ts
// src/hooks/useMyResource.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import type { MyResource } from '@/types'

export const MY_RESOURCE_KEY = ['myResource'] as const

export function useMyResource() {
  return useQuery<MyResource[]>({
    queryKey: MY_RESOURCE_KEY,
    queryFn: () => api.get('/my-resource').then(r => r.data),
  })
}
```

---

## Verifying the Architecture Rules

Run these checks after any change to confirm no layering violations:

```bash
# No Prisma imports in route handlers
grep -r "from '@prisma/client'" src/app/api/ && echo "VIOLATION" || echo "OK"
grep -r "from '@/lib/prisma'" src/app/api/ && echo "VIOLATION" || echo "OK"

# No dangerouslySetInnerHTML without SafeMarkdown
grep -r "dangerouslySetInnerHTML" src/ && echo "REVIEW NEEDED"

# No direct Anthropic fetch in client components
grep -r "api.anthropic.com" src/app/ && echo "VIOLATION" || echo "OK"

# No browser prompt() calls
grep -r "prompt(" src/ && echo "VIOLATION" || echo "OK"

# TypeScript strict check
npx tsc --noEmit
```
