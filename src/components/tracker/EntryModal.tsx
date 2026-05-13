'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, DollarSign } from 'lucide-react'
import api from '@/lib/apiClient'
import { toLocalTime, cn } from '@/lib/utils'
import type { TimeEntry, Project } from '@/types'

interface FormData {
  description: string
  projectId: string
  taskId: string
  tag: string
  date: string
  startTime: string
  endTime: string
  billable: boolean
}

interface Props {
  entry?: TimeEntry | null
  projects: Project[]
  onClose: () => void
}

export default function EntryModal({ entry, projects, onClose }: Props) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormData>()
  const billable = watch('billable')

  useEffect(() => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`

    if (entry) {
      const startDate = new Date(entry.startTime)
      const datePad = (n: number) => String(n).padStart(2, '0')
      const dateStr = `${startDate.getFullYear()}-${datePad(startDate.getMonth() + 1)}-${datePad(startDate.getDate())}`
      reset({
        description: entry.description ?? '',
        projectId: entry.projectId ?? '',
        taskId: entry.taskId ?? '',
        tag: entry.tag?.name ?? '',
        date: dateStr,
        startTime: toLocalTime(entry.startTime),
        endTime: entry.endTime ? toLocalTime(entry.endTime) : '',
        billable: entry.billable,
      })
    } else {
      reset({ description: '', projectId: '', taskId: '', tag: '', date: todayStr, startTime: nowTime, endTime: nowTime, billable: false })
    }
  }, [entry, reset])

  const buildISO = (dateStr: string, timeStr: string) => {
    if (!timeStr) return null
    return new Date(`${dateStr}T${timeStr}:00`).toISOString()
  }

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const startISO = buildISO(data.date, data.startTime)
      if (!startISO) throw new Error('Invalid start time')
      const payload = {
        description: data.description,
        projectId: data.projectId || null,
        taskId: data.taskId || null,
        tag: data.tag || null,
        billable: data.billable,
        startTime: startISO,
        endTime: data.endTime ? buildISO(data.date, data.endTime) : null,
      }
      return entry
        ? api.put(`/time-entries/${entry.id}`, payload)
        : api.post('/time-entries', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeEntries'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      onClose()
    },
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-[440px] overflow-y-auto rounded-2xl border border-white/10 bg-[rgb(var(--bg-secondary))] p-4 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">{entry ? 'Edit Entry' : 'Add Time Entry'}</h2>
          <button className="text-white/40 hover:text-white transition-colors" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="What did you work on?" {...register('description')} />
          </div>

          <div>
            <label className="label">Date</label>
            <input className="input" type="date" {...register('date', { required: true })} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Start time</label>
              <input className="input" type="time" {...register('startTime', { required: true })} />
            </div>
            <div>
              <label className="label">End time</label>
              <input className="input" type="time" {...register('endTime')} />
            </div>
          </div>

          <div>
            <label className="label">Project</label>
            <select className="input cursor-pointer" {...register('projectId')}>
              <option value="">No project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Task (optional)</label>
            <input className="input" placeholder="Task name or ID" {...register('taskId')} />
          </div>

          <div>
            <label className="label">Tag</label>
            <input className="input" placeholder="e.g. meeting, dev, review" {...register('tag')} />
          </div>

          {/* Billable toggle */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <DollarSign size={14} className={billable ? 'text-emerald-400' : 'text-white/30'} />
              <span className="text-sm text-white/70">Billable</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={billable}
              onClick={() => setValue('billable', !billable)}
              className={cn(
                'relative w-9 h-5 rounded-full transition-colors',
                billable ? 'bg-emerald-500' : 'bg-white/10'
              )}
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                billable ? 'translate-x-4' : 'translate-x-0'
              )} />
            </button>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost w-full sm:w-auto" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
