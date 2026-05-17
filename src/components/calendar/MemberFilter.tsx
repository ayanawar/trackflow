'use client'
// Uses GET /api/workspaces/[id]/members (MANAGER/ADMIN only) to list workspace members.
// This endpoint was created specifically for this component since neither
// GET /api/organizations/[orgId]/members (org-scoped) nor GET /api/admin/users
// (ADMIN-only) satisfied the MANAGER+workspace-scoped requirement.
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { useAuthStore } from '@/lib/authStore'
import api from '@/lib/apiClient'

interface Member {
  id: string
  name: string
  avatarUrl?: string | null
}

interface MemberFilterProps {
  selectedUserId: string | undefined
  onSelect: (userId: string | undefined) => void
}

function useWorkspaceMembers() {
  const { user } = useAuthStore()
  const workspaceId = user?.activeWorkspaceId
  return useQuery<Member[]>({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/members`).then(r => r.data),
    enabled: !!workspaceId,
    staleTime: 60_000,
  })
}

export default function MemberFilter({ selectedUserId, onSelect }: MemberFilterProps) {
  const { data: members = [] } = useWorkspaceMembers()

  return (
    <div className="flex items-center gap-2">
      <Users size={14} style={{ color: 'rgb(var(--text-faint))' }} />
      <select
        value={selectedUserId ?? ''}
        onChange={e => onSelect(e.target.value || undefined)}
        className="rounded-lg px-3 py-1.5 text-sm"
        style={{
          background: 'rgb(var(--bg-primary))',
          border: '1px solid var(--border)',
          color: 'rgb(var(--text-base))',
          outline: 'none',
        }}
        aria-label="Filter by team member"
      >
        <option value="">All members</option>
        {members.map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
    </div>
  )
}
