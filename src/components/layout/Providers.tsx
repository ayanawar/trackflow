'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/authStore'
import api from '@/lib/apiClient'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }))
  const { setUser } = useAuthStore()

  useEffect(() => {
    api.get('/auth/me').then(r => setUser(r.data)).catch(() => {})
  }, [setUser])

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
