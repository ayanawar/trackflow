import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import { STATS_KEY } from '@/hooks/useStats'
import type { TimeEntry } from '@/types'

export const TIME_ENTRIES_KEY = ['timeEntries'] as const

export function useTimeEntries(limit = 100) {
  return useQuery<TimeEntry[]>({
    queryKey: [...TIME_ENTRIES_KEY, limit],
    queryFn: () => api.get(`/time-entries?limit=${limit}`).then(r => r.data),
    refetchInterval: 10000,
  })
}

export function useTimeEntriesByTag(limit = 100, tagId?: string | null) {
  return useQuery<TimeEntry[]>({
    queryKey: [...TIME_ENTRIES_KEY, limit, tagId ?? 'all'],
    queryFn: () => api.get(`/time-entries?limit=${limit}${tagId ? `&tagId=${tagId}` : ''}`).then(r => r.data),
    refetchInterval: 10000,
  })
}

function invalidateBoth(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: TIME_ENTRIES_KEY })
  qc.invalidateQueries({ queryKey: STATS_KEY })
}

export function useCreateEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      description?: string
      projectId?: string | null
      taskId?: string | null
      tagId?: string | null
      tag?: string | null
      billable?: boolean
      startTime: string
      endTime?: string | null
    }) => api.post('/time-entries', data).then(r => r.data),
    onSuccess: () => invalidateBoth(qc),
  })
}

export function useStopEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, endTime }: { id: string; endTime: string }) =>
      api.patch(`/time-entries/${id}/stop`, { endTime }).then(r => r.data),
    onSuccess: () => invalidateBoth(qc),
  })
}

export function usePauseEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/time-entries/${id}/pause`).then(r => r.data),
    onSuccess: () => invalidateBoth(qc),
  })
}

export function useResumeEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/time-entries/${id}/resume`).then(r => r.data),
    onSuccess: () => invalidateBoth(qc),
  })
}

export function useUpdateEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: {
      id: string
      description?: string
      projectId?: string | null
      taskId?: string | null
      tagId?: string | null
      tag?: string | null
      billable?: boolean
      startTime?: string
      endTime?: string | null
    }) => api.put(`/time-entries/${id}`, data).then(r => r.data),
    onSuccess: () => invalidateBoth(qc),
  })
}

export function useDeleteEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/time-entries/${id}`),
    onSuccess: () => invalidateBoth(qc),
  })
}
