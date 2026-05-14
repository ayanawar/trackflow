'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Clock, LayoutDashboard, BarChart2, Folder, Sparkles, LogOut, Settings, Building2 } from 'lucide-react'
import { useAuthStore } from '@/lib/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/tracker', icon: Clock, label: 'Tracker' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/reports', icon: BarChart2, label: 'Reports' },
  { href: '/projects', icon: Folder, label: 'Projects' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const initials = user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? 'U'
  const mobileItems = [
    ...navItems,
    { href: '/insights', icon: Sparkles, label: 'AI' },
    { href: '/organizations', icon: Building2, label: 'Orgs' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.07] bg-[rgb(var(--bg-secondary))]/95 px-4 backdrop-blur lg:hidden">
        <Link href="/tracker" className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <Clock size={14} className="text-white" />
          </div>
          <span className="text-[16px] font-semibold tracking-tight text-white truncate">TrackFlow</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="hidden min-w-0 text-right min-[380px]:block">
            <p className="max-w-[120px] truncate text-[12px] font-medium leading-none text-white">{user?.name ?? 'User'}</p>
            <p className="mt-0.5 max-w-[120px] truncate text-[11px] text-white/40">{user?.workspace ?? 'Workspace'}</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent-purple flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
            {initials}
          </div>
          <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/45 hover:text-accent-red" onClick={handleLogout} title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t border-white/[0.08] bg-[rgb(var(--bg-secondary))]/95 px-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur lg:hidden">
        {mobileItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={cn('flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] leading-none text-white/45 transition-colors hover:text-white', active && 'bg-accent/10 text-accent')}>
              <Icon size={16} />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          )
        })}
      </nav>

      <aside className="hidden w-[220px] min-w-[220px] flex-col bg-[rgb(var(--bg-secondary))] border-r border-white/[0.07] h-screen sticky top-0 lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-[22px] border-b border-white/[0.07]">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <Clock size={14} className="text-white" />
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-white">TrackFlow</span>
        </div>

        <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className={cn('nav-link', pathname.startsWith(href) && 'active')}>
              <Icon size={15} />{label}
            </Link>
          ))}
          <div className="mt-3 mb-1 px-3 text-[10px] text-white/25 uppercase tracking-widest font-medium">AI</div>
          <Link href="/insights" className={cn('nav-link', pathname === '/insights' && 'active')}>
            <Sparkles size={15} />AI Insights
          </Link>

          <Link href="/organizations" className={cn('nav-link', pathname.startsWith('/organizations') && 'active')}>
            <Building2 size={15} />Organizations
          </Link>
        </nav>

        <div className="border-t border-white/[0.07] p-2">
          <Link href="/settings" className={cn('nav-link', pathname === '/settings' && 'active')}>
            <Settings size={15} />Settings
          </Link>
          <button className="nav-link text-white/40 hover:text-accent-red" onClick={handleLogout}>
            <LogOut size={15} />Sign out
          </button>
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent-purple flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-white leading-none truncate">{user?.name ?? 'User'}</p>
              <p className="text-[11px] text-white/40 mt-0.5 truncate">{user?.workspace ?? 'Workspace'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
