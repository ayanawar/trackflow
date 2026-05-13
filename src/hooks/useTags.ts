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

export function useDeleteTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: TAGS_KEY }),
  })
}
