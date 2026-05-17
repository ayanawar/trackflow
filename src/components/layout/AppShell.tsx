'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import { useAuthStore } from '@/lib/authStore'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [isLoading, pathname, router, user])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pt-14 pb-20 lg:pt-0 lg:pb-0">
        {isLoading ? (
          <div className="flex min-h-screen items-center justify-center px-6">
            <div className="h-10 w-10 rounded-full border-2 border-white/15 border-t-accent animate-spin" aria-label="Loading session" />
          </div>
        ) : user ? children : null}
      </main>
    </div>
  )
}
