'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import api from '@/lib/apiClient'
import { useAuthStore } from '@/lib/authStore'

export default function AdminTeamsPage() {
  const { user, isLoading: authLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user && user.role !== 'ADMIN') router.replace('/dashboard')
  }, [authLoading, user, router])

  const { data: teams = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-teams'],
    queryFn: () => api.get('/admin/teams').then(r => r.data),
    enabled: !authLoading && user?.role === 'ADMIN',
  })

  if (authLoading || user?.role !== 'ADMIN') return (
    <AppShell>
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="h-10 w-10 rounded-full border-2 border-white/15 border-t-accent animate-spin" aria-label="Loading admin session" />
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <div className="page-header flex items-center gap-3">
        <Users size={15} className="text-white/40" />
        <h1 className="text-[15px] font-semibold text-white">Teams</h1>
      </div>
      <div className="page-body">
        <div className="page-container">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07] text-sm font-medium text-white">
              {isLoading ? 'Loading teams...' : `${teams.length} team${teams.length === 1 ? '' : 's'}`}
            </div>
            <div className="divide-y divide-white/[0.05]">
              {teams.map(team => (
                <div key={team.id} className="px-5 py-4">
                  <p className="text-sm font-medium text-white">{team.name}</p>
                  <p className="text-xs text-white/40 mt-1">{team.description || 'No description'}</p>
                </div>
              ))}
              {!isLoading && teams.length === 0 && (
                <div className="px-5 py-12 text-center text-sm text-white/35">No teams yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
