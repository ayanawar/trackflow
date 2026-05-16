import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import type { Tag } from '@/types'

export const TAGS_KEY = ['tags'] as const

export function useTags() {
  return useQuery<Tag[]>({
    queryKey: TAGS_KEY,
    queryFn: () => api.get('/tags').then(r => r.data),
  })
}

export function useManageTags() {
  return useQuery<Tag[]>({
    queryKey: [...TAGS_KEY, 'manage'],
    queryFn: () => api.get('/tags?status=all&includeUsage=true').then(r => r.data),
  })
}

export function useCreateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; color?: string }) =>
      api.post('/tags', data).then(r => r.data as Tag),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TAGS_KEY })
      qc.invalidateQueries({ queryKey: [...TAGS_KEY, 'manage'] })
    },
  })
}

export function useUpdateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; color?: string; status?: 'ACTIVE' | 'INACTIVE' }) =>
      api.patch(`/tags/${id}`, data).then(r => r.data as Tag),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TAGS_KEY })
      qc.invalidateQueries({ queryKey: [...TAGS_KEY, 'manage'] })
    },
  })
}

export function useDeactivateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/tags/${id}/deactivate`).then(r => r.data as Tag),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TAGS_KEY })
      qc.invalidateQueries({ queryKey: [...TAGS_KEY, 'manage'] })
    },
  })
}

export function useDeleteTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tags/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TAGS_KEY })
      qc.invalidateQueries({ queryKey: [...TAGS_KEY, 'manage'] })
    },
  })
}
