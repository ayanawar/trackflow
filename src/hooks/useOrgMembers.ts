import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'

const membersKey = (orgId: string) => ['organizations', orgId, 'members'] as const
const invitesKey = (orgId: string) => ['organizations', orgId, 'invitations'] as const

export interface OrgMember {
  id: string
  role: string
  user: { id: string; name: string; email: string; avatarUrl: string | null }
}

export interface Invitation {
  id: string
  email: string
  role: string
  expiresAt: string
}

export function useOrgMembers(orgId: string) {
  return useQuery<OrgMember[]>({
    queryKey: membersKey(orgId),
    queryFn: () => api.get(`/organizations/${orgId}/members`).then(r => r.data),
    enabled: !!orgId,
  })
}

export function useOrgInvitations(orgId: string) {
  return useQuery<Invitation[]>({
    queryKey: invitesKey(orgId),
    queryFn: () => api.get(`/organizations/${orgId}/invitations`).then(r => r.data),
    enabled: !!orgId,
  })
}

export function useInviteMember(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      api.post(`/organizations/${orgId}/invitations`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: invitesKey(orgId) }),
  })
}

export function useCancelInvitation(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteId: string) => api.delete(`/organizations/${orgId}/invitations/${inviteId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: invitesKey(orgId) }),
  })
}

export function useUpdateMemberRole(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.put(`/organizations/${orgId}/members/${userId}`, { role }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(orgId) }),
  })
}

export function useRemoveMember(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/organizations/${orgId}/members/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(orgId) }),
  })
}
