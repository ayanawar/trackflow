'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/authStore'
import api from '@/lib/apiClient'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
  }))
  const { setUser, setLoading } = useAuthStore()
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    setLoading(true)

    // Always validate the session on mount — the interceptor handles 401 → refresh → retry
    // or redirects to login if the session is truly expired.
    api.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => setUser(null))
  }, [setLoading, setUser])

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </GoogleOAuthProvider>
  )
}
