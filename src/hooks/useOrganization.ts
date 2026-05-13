import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/apiClient'

export interface OrgSummary {
  id: string
  name: string
  slug: string
  avatarUrl: string | null
  role: string
  createdAt: string
}

export const ORGS_KEY = ['organizations'] as const
export const orgKey = (orgId: string) => ['organizations', orgId] as const

export function useOrganizations() {
  return useQuery<OrgSummary[]>({
    queryKey: ORGS_KEY,
    queryFn: () => api.get('/organizations').then(r => r.data),
  })
}

export function useOrg(orgId: string) {
  return useQuery({
    queryKey: orgKey(orgId),
    queryFn: () => api.get(`/organizations/${orgId}`).then(r => r.data),
    enabled: !!orgId,
  })
}

export function useCreateOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; slug: string }) =>
      api.post('/organizations', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORGS_KEY }),
  })
}

export function useUpdateOrg(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name?: string; avatarUrl?: string | null }) =>
      api.put(`/organizations/${orgId}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORGS_KEY })
      qc.invalidateQueries({ queryKey: orgKey(orgId) })
    },
  })
}

export function useDeleteOrg(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/organizations/${orgId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORGS_KEY }),
  })
}

export function useSwitchOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orgId: string) => api.post(`/organizations/${orgId}/switch`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORGS_KEY })
      window.location.reload()
    },
  })
}
