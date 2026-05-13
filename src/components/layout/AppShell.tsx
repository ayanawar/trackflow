'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import { useAuthStore } from '@/lib/authStore'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login')
  }, [isLoading, router, user])

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 pt-14 pb-20 lg:pt-0 lg:pb-0">
        {isLoading ? (
          <div className="flex min-h-screen items-center justify-center px-6">
            <div className="h-10 w-10 rounded-full border-2 border-white/15 border-t-accent animate-spin" aria-label="Loading session" />
          </div>
        ) : user ? children : null}
      </main>
    </div>
  )
}
