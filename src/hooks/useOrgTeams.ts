import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'

const teamsKey = (orgId: string) => ['organizations', orgId, 'teams'] as const

export interface TeamMember {
  userId: string
  user: { id: string; name: string; email: string; avatarUrl: string | null }
}

export interface Team {
  id: string
  name: string
  description: string | null
  members: TeamMember[]
  _count: { members: number }
}

export function useOrgTeams(orgId: string) {
  return useQuery<Team[]>({
    queryKey: teamsKey(orgId),
    queryFn: () => api.get(`/organizations/${orgId}/teams`).then(r => r.data),
    enabled: !!orgId,
  })
}

export function useCreateTeam(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string | null }) =>
      api.post(`/organizations/${orgId}/teams`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamsKey(orgId) }),
  })
}

export function useUpdateTeam(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, ...data }: { teamId: string; name?: string; description?: string | null }) =>
      api.put(`/organizations/${orgId}/teams/${teamId}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamsKey(orgId) }),
  })
}

export function useDeleteTeam(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (teamId: string) => api.delete(`/organizations/${orgId}/teams/${teamId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamsKey(orgId) }),
  })
}

export function useAddTeamMember(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      api.post(`/organizations/${orgId}/teams/${teamId}/members`, { userId }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamsKey(orgId) }),
  })
}

export function useRemoveTeamMember(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      api.delete(`/organizations/${orgId}/teams/${teamId}/members/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamsKey(orgId) }),
  })
}
