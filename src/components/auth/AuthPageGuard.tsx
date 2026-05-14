'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'

export default function AuthPageGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (user) router.replace(user.role === 'ADMIN' ? '/admin/users' : '/tracker')
  }, [user, router])

  if (isLoading || user) return null
  return <>{children}</>
}
