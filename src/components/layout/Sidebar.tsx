'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Clock, LayoutDashboard, BarChart2, Folder, Sparkles, LogOut, Settings, Building2, ShieldCheck, Users, Tags, PanelsTopLeft, CalendarDays } from 'lucide-react'
import { useAuthStore } from '@/lib/authStore'
import { cn } from '@/lib/utils'
import WorkspaceSwitcher from '@/components/workspace/WorkspaceSwitcher'

const navItems = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/tracker',       icon: Clock,           label: 'Tracker' },
  { href: '/calendar',      icon: CalendarDays,    label: 'Calendar' },
  { href: '/reports',       icon: BarChart2,       label: 'Reports' },
  { href: '/projects',      icon: Folder,          label: 'Projects' },
  { href: '/workspaces',    icon: PanelsTopLeft,   label: 'Workspaces' },
  { href: '/organizations', icon: Building2,       label: 'Organizations' },
]

const bottomItems = [
  { href: '/insights', icon: Sparkles, label: 'AI' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout } = useAuthStore()

  const initials = user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? 'U'

  const mobileItems = [...navItems, ...bottomItems, { href: '/settings', icon: Settings, label: 'Settings' }]

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur lg:hidden"
        style={{ borderColor: 'var(--border)', background: 'rgb(var(--bg-secondary) / 0.95)' }}>
        <Link href="/tracker" className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg animated-gradient flex items-center justify-center flex-shrink-0 shadow-lg">
            <Clock size={14} className="text-white" />
          </div>
          <span className="text-[16px] font-bold tracking-tight gradient-text hidden min-[360px]:block">TrackFlow</span>
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <div className="hidden min-[430px]:block">
            <WorkspaceSwitcher />
          </div>
          <div className="w-7 h-7 rounded-full animated-gradient flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-md">
            {initials}
          </div>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:text-red-400 hover:bg-red-400/10"
            style={{ color: 'rgb(var(--text-muted))', border: '1px solid var(--border)' }}
            onClick={handleLogout} title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* ── Mobile bottom nav ───────────────────────── */}
      <nav
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 grid border-t px-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur lg:hidden'
        )}
        style={{
          borderColor: 'var(--border)',
          background: 'rgb(var(--bg-secondary) / 0.95)',
          gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))`,
        }}
      >
        {mobileItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={cn(
                'flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] leading-none transition-all',
                active ? 'text-accent bg-accent/10' : 'text-white/45 hover:text-white'
              )}
              style={active ? { color: 'rgb(var(--accent))' } : {}}
            >
              <Icon size={16} />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ── Desktop sidebar ─────────────────────────── */}
      <aside
        className="hidden w-[228px] min-w-[228px] flex-col h-full lg:flex animate-slide-in-left"
        style={{ background: 'rgb(var(--bg-secondary))', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-xl animated-gradient flex items-center justify-center flex-shrink-0 shadow-lg animate-float">
            <Clock size={15} className="text-white" />
          </div>
          <span className="text-[17px] font-bold tracking-tight gradient-text">TrackFlow</span>
        </div>

        <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <WorkspaceSwitcher align="left" />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2.5 flex flex-col gap-0.5 overflow-y-auto stagger">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn('nav-link animate-fade-in', pathname.startsWith(href) && 'active')}
            >
              <Icon size={15} />{label}
            </Link>
          ))}

          <div className="mt-3 mb-1 px-3 text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'rgb(var(--text-faint))' }}>
            Tools
          </div>

          {bottomItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn('nav-link', pathname === href && 'active')}
            >
              <Icon size={15} />{label}
            </Link>
          ))}

          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <>
              <div className="mt-3 mb-1 px-3 text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'rgb(var(--text-faint))' }}>
                Manage
              </div>
              <Link href="/admin/tags" className={cn('nav-link', pathname.startsWith('/admin/tags') && 'active')}>
                <Tags size={15} />Tags
              </Link>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <Link href="/admin/users" className={cn('nav-link', pathname.startsWith('/admin/users') && 'active')}>
                <ShieldCheck size={15} />User Management
              </Link>
              <Link href="/admin/teams" className={cn('nav-link', pathname.startsWith('/admin/teams') && 'active')}>
                <Users size={15} />Teams
              </Link>
              <Link href="/admin/clients" className={cn('nav-link', pathname.startsWith('/admin/clients') && 'active')}>
                <Building2 size={15} />Clients
              </Link>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-2.5" style={{ borderTop: '1px solid var(--border)' }}>
          <Link href="/settings" className={cn('nav-link', pathname === '/settings' && 'active')}>
            <Settings size={15} />Settings
          </Link>

          <button className="nav-link hover:text-red-400 hover:bg-red-400/10 mt-0.5" onClick={handleLogout}>
            <LogOut size={15} />Sign out
          </button>

          {/* User badge */}
          <Link href="/settings" className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-xl transition-all hover:bg-white/5 group">
            <div className="w-8 h-8 rounded-full animated-gradient flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold leading-none truncate" style={{ color: 'rgb(var(--text-base))' }}>
                {user?.name ?? 'User'}
              </p>
              <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgb(var(--text-faint))' }}>
                {user?.activeWorkspaceId ? 'Active workspace' : 'Workspace'}
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  )
}
