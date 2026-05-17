import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import { useAuthStore } from '@/lib/authStore'

export interface WorkspaceSummary {
  id: string
  orgId: string
  name: string
  createdAt: string
  role: 'ADMIN' | 'MEMBER'
  memberCount: number
  isActive: boolean
}

export const WORKSPACES_KEY = ['workspaces'] as const

export function useWorkspaces() {
  return useQuery<WorkspaceSummary[]>({
    queryKey: WORKSPACES_KEY,
    queryFn: () => api.get('/workspaces').then(r => r.data),
    staleTime: 30_000,
  })
}

export function useCreateWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { orgId: string; name: string }) =>
      api.post('/workspaces', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WORKSPACES_KEY })
    },
  })
}

export function useDeleteWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, confirmName }: { id: string; confirmName: string }) =>
      api.delete(`/workspaces/${id}`, { data: { confirmName } }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WORKSPACES_KEY })
    },
  })
}

export function useSwitchWorkspace() {
  const qc = useQueryClient()
  const setActiveWorkspace = useAuthStore(s => s.setActiveWorkspace)
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/workspaces/${id}/switch`).then(r => r.data as { activeWorkspaceId: string }),
    onSuccess: data => {
      setActiveWorkspace(data.activeWorkspaceId)
      // Wipe every workspace-scoped query so the UI refetches under the new scope.
      qc.invalidateQueries()
    },
  })
}
