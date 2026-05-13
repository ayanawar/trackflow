import { useQuery } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import type { Stats } from '@/types'

export const STATS_KEY = ['stats'] as const

export function useStats() {
  return useQuery<Stats>({
    queryKey: STATS_KEY,
    queryFn: () => api.get('/stats').then(r => r.data),
    refetchInterval: 15000,
  })
}
