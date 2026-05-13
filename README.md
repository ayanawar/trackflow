# TrackFlow — Full-Stack Next.js Time Tracking App

A complete time tracking app built entirely with **Next.js 14** — frontend UI and backend API routes in one codebase, with **Prisma ORM** and **SQLite** (dev) / **PostgreSQL** (prod).

🔗 **Repo:** https://github.com/ayanawar4/trackflow

---

## Architecture

```
src/
├── app/
│   ├── api/                  ← Backend (Next.js API Routes)
│   │   ├── auth/             
│   │   │   ├── register/     POST —  create account
│   │   │   ├── login/        POST — login, set JWT cookie
│   │   │   ├── logout/       POST — clear cookie
│   │   │   └── me/           GET — current user, PATCH — update profile
│   │   ├── time-entries/     GET, POST + [id]: GET, PUT, DELETE
│   │   │   └── [id]/stop/    PATCH — stop running timer
│   │   ├── projects/         GET, POST + [id]: GET, PUT, DELETE
│   │   ├── tags/             GET, POST + [id]: DELETE
│   │   └── stats/            GET — aggregated stats + chart data
│   │
│   ├── tracker/              ← Main tracker UI
│   ├── dashboard/            ← Charts & weekly overview
│   ├── reports/              ← Filterable table + CSV export
│   ├── projects/             ← Project management
│   ├── insights/             ← Claude AI analysis
│   ├── settings/             ← Profile settings
│   └── auth/login|register/  ← Auth pages
│
├── components/               ← Reusable UI components
├── lib/                      ← Prisma, auth (JWT), utils, Zustand store
├── middleware.ts             ← Route protection
└── types/                    ← TypeScript types
prisma/
├── schema.prisma             ← Database schema
└── seed.ts                   ← Demo data seeder
```

---

## Quick Start (Local)

### 1. Install dependencies
```bash
bun install
```

### 2. Set up environment
```bash
cp .env.example .env.local
# .env.local is pre-configured for SQLite — no changes needed for dev
```

### 3. Set up database
```bash
bun run db:push    # Create SQLite tables
bun run db:seed    # Add demo data
```

### 4. Run the app
```bash
bun run dev        # http://localhost:3000
```

**Demo login:** `demo@trackflow.com` / `password`

---

## Deploy to Vercel + Railway (Free)

### Backend Database — Railway (free PostgreSQL)

1. Go to [railway.app](https://railway.app) → New Project → **PostgreSQL**
2. Copy the `DATABASE_URL` from the Connect tab

### Frontend + API — Vercel (free)

1. Go to [vercel.com](https://vercel.com) → Import `ayanawar4/trackflow`
2. Add environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_PROVIDER` | `postgresql` |
| `DATABASE_URL` | `postgresql://...` from Railway |
| `JWT_SECRET` | Any random 32+ character string |

3. Add build command override in Vercel settings:
   ```
   prisma generate && prisma migrate deploy && next build
   ```
4. Deploy!

### Alternative: Neon.tech (free PostgreSQL, serverless)
Free tier with 0.5GB storage, perfect for this app.
1. Sign up at [neon.tech](https://neon.tech)
2. Create a database, copy the connection string
3. Use it as `DATABASE_URL` in Vercel

---

## API Reference

All endpoints are Next.js API routes under `/api/`. Auth uses **HttpOnly JWT cookies**.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → sets cookie |
| POST | `/api/auth/logout` | Clear cookie |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/me` | Update profile |

### Time Entries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/time-entries` | List entries |
| POST | `/api/time-entries` | Create / start timer |
| PUT | `/api/time-entries/:id` | Update entry |
| PATCH | `/api/time-entries/:id/stop` | Stop running timer |
| DELETE | `/api/time-entries/:id` | Delete entry |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List with totals |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Today/week/month + daily chart |

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Runtime / Package Manager | Bun |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database ORM | Prisma |
| Database (dev) | SQLite |
| Database (prod) | PostgreSQL |
| Auth | JWT via `jose` + HttpOnly cookies |
| Validation | Zod |
| State | Zustand (auth), TanStack Query (server) |
| Forms | React Hook Form |
| Charts | Recharts |
| HTTP Client | Axios |
| Icons | Lucide React |
| AI | Claude API (Anthropic) |
