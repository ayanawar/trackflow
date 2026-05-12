'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Clock, LayoutDashboard, BarChart2, Folder, Sparkles, LogOut, Settings } from 'lucide-react'
import { useAuthStore } from '@/lib/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/tracker',   icon: Clock,           label: 'Tracker' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/reports',   icon: BarChart2,        label: 'Reports' },
  { href: '/projects',  icon: Folder,           label: 'Projects' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const initials = user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? 'U'

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <aside className="w-[220px] min-w-[220px] flex flex-col bg-[rgb(var(--bg-secondary))] border-r border-white/[0.07] h-screen sticky top-0">
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
  )
}
