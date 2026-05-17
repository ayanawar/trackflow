import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import type { TimeEntry } from '@/types'

export const CALENDAR_ENTRIES_KEY = ['time-entries', 'calendar'] as const

export interface CalendarEntriesParams {
  startDate: string
  endDate: string
  userId?: string
  projectId?: string
  tagId?: string
}

export function useCalendarEntries(params: CalendarEntriesParams) {
  return useQuery<TimeEntry[]>({
    queryKey: [...CALENDAR_ENTRIES_KEY, params],
    queryFn: () => {
      const search = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate,
        limit: '500',
      })
      if (params.userId) search.set('userId', params.userId)
      if (params.projectId) search.set('projectId', params.projectId)
      if (params.tagId) search.set('tagId', params.tagId)
      return api.get(`/time-entries?${search.toString()}`).then(r => r.data)
    },
    staleTime: 30_000,
  })
}

export function useInvalidateCalendarEntries() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: CALENDAR_ENTRIES_KEY })
    qc.invalidateQueries({ queryKey: ['timeEntries'] })
  }
}
