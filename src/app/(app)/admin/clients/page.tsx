'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

import api from '@/lib/apiClient'
import { useAuthStore } from '@/lib/authStore'

export default function AdminClientsPage() {
  const { user, isLoading: authLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user && user.role !== 'ADMIN') router.replace('/dashboard')
  }, [authLoading, user, router])

  const { data: clients = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-clients'],
    queryFn: () => api.get('/admin/clients').then(r => r.data),
    enabled: !authLoading && user?.role === 'ADMIN',
  })

  if (authLoading || user?.role !== 'ADMIN') return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="h-10 w-10 rounded-full border-2 border-white/15 border-t-accent animate-spin" aria-label="Loading admin session" />
    </div>
  )

  return (
    <>
      <div className="page-header flex items-center gap-3">
        <Building2 size={15} className="text-white/40" />
        <h1 className="text-[15px] font-semibold text-white">Clients</h1>
      </div>
      <div className="page-body">
        <div className="page-container">
          {isLoading ? (
            <div className="text-center py-20 text-white/30 text-sm">Loading clients…</div>
          ) : clients.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                <Building2 size={26} className="text-white/20" />
              </div>
              <p className="text-base font-semibold text-white mb-1">No clients yet</p>
              <p className="text-sm text-white/35 max-w-xs">Add your first client to start assigning projects and tracking time by account.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.07] text-sm font-medium text-white">
                {clients.length} client{clients.length === 1 ? '' : 's'}
              </div>
              <div className="divide-y divide-white/[0.05]">
                {clients.map(client => (
                  <div key={client.id} className="px-5 py-4">
                    <p className="text-sm font-medium text-white">{client.name}</p>
                    <p className="text-xs text-white/40 mt-1">{client.description || 'No description'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    
  </>
  )
}
