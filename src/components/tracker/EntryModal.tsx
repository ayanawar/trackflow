'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import api from '@/lib/apiClient'
import { toLocalTime } from '@/lib/utils'
import type { TimeEntry, Project } from '@/types'

interface FormData {
  description: string
  projectId: string
  tag: string
  startTime: string
  endTime: string
}

interface Props {
  entry?: TimeEntry | null
  projects: Project[]
  onClose: () => void
}

export default function EntryModal({ entry, projects, onClose }: Props) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset } = useForm<FormData>()

  useEffect(() => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const nowStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    if (entry) {
      reset({
        description: entry.description ?? '',
        projectId: entry.projectId ?? '',
        tag: entry.tag?.name ?? '',
        startTime: toLocalTime(entry.startTime),
        endTime: entry.endTime ? toLocalTime(entry.endTime) : '',
      })
    } else {
      reset({ description: '', projectId: '', tag: '', startTime: nowStr, endTime: nowStr })
    }
  }, [entry, reset])

  const buildISO = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number)
    const d = new Date()
    d.setHours(h, m, 0, 0)
    return d.toISOString()
  }

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        description: data.description,
        projectId: data.projectId || null,
        tag: data.tag || null,
        startTime: buildISO(data.startTime),
        endTime: data.endTime ? buildISO(data.endTime) : null,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[rgb(var(--bg-secondary))] border border-white/10 rounded-2xl p-6 w-[440px] max-w-[95vw] shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">{entry ? 'Edit Entry' : 'Add Time Entry'}</h2>
          <button className="text-white/40 hover:text-white transition-colors" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="What did you work on?" {...register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <label className="label">Tag</label>
            <input className="input" placeholder="e.g. billable, meeting, dev" {...register('tag')} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
