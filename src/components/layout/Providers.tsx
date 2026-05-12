'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/authStore'
import api from '@/lib/apiClient'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
  }))
  const { user, setUser } = useAuthStore()
  const fetched = useRef(false)

  useEffect(() => {
    // Only fetch once per session, and only if we don't already have a user
    if (fetched.current) return
    fetched.current = true
    if (user) return // already hydrated from persisted store

    api.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => {
        // 401 = not logged in, silently ignore
        setUser(null)
      })
  }, []) // empty deps — run once only

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
