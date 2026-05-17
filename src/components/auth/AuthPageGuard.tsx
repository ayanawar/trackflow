'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { safeNext } from '@/lib/safeNext'

export default function AuthPageGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      const rawNext = typeof window === 'undefined'
        ? null
        : new URLSearchParams(window.location.search).get('next')
      router.replace(safeNext(rawNext))
    }
  }, [user, router])

  if (isLoading || user) return null
  return <>{children}</>
}
