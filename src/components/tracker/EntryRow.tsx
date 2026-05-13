'use client'
import { Play, Trash2, Pencil, DollarSign } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import { formatDuration, formatTimeRange } from '@/lib/utils'
import type { TimeEntry } from '@/types'

interface Props {
  entry: TimeEntry
  onEdit?: (entry: TimeEntry) => void
}

export default function EntryRow({ entry, onEdit }: Props) {
  const qc = useQueryClient()

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['timeEntries'] })
    qc.invalidateQueries({ queryKey: ['stats'] })
  }

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/time-entries/${entry.id}`),
    onSuccess: invalidate,
  })

  const continueMutation = useMutation({
    mutationFn: () => api.post('/time-entries', {
      description: entry.description,
      projectId: entry.projectId,
      taskId: entry.taskId,
      tag: entry.tag?.name ?? null,
      billable: entry.billable,
      startTime: new Date().toISOString(),
    }),
    onSuccess: invalidate,
  })

  return (
    <div className="group flex flex-wrap items-center gap-3 card px-3 py-3 mb-1 hover:border-white/[0.14] transition-colors sm:flex-nowrap sm:px-4">
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.project?.color ?? '#444' }} />

      <div className="min-w-0 flex-[1_1_calc(100%-2rem)] sm:flex-1">
        <p className="text-sm text-white truncate">{entry.description || <span className="text-white/30 italic">No description</span>}</p>
        {entry.project && <p className="text-xs text-white/40 mt-0.5 truncate">{entry.project.name}{entry.project.client ? ` · ${entry.project.client}` : ''}</p>}
      </div>

      {entry.billable && (
        <span title="Billable" className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
          <DollarSign size={10} />
        </span>
      )}

      {entry.tag && (
        <span className="max-w-[45%] truncate text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 flex-shrink-0 sm:max-w-[120px]">{entry.tag.name}</span>
      )}

      <span className="text-xs text-white/40 font-mono min-w-[130px] text-center hidden sm:block">
        {formatTimeRange(entry.startTime, entry.endTime)}
      </span>

      <span className="font-mono text-sm font-medium text-white min-w-[55px] text-right ml-auto">
        {entry.duration != null ? formatDuration(entry.duration) : '—'}
      </span>

      <div className="flex gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <button className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:border-white/20" title="Continue" onClick={() => continueMutation.mutate()}>
          <Play size={11} className="text-white/50 ml-0.5" />
        </button>
        <button className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:border-white/20" title="Edit" onClick={() => onEdit?.(entry)}>
          <Pencil size={11} className="text-white/50" />
        </button>
        <button className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:border-red-500/40" title="Delete" onClick={() => deleteMutation.mutate()}>
          <Trash2 size={11} className="text-white/50 group-hover:text-accent-red" />
        </button>
      </div>
    </div>
  )
}
