'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { X, Trash2 } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { useTags } from '@/hooks/useTags'
import { useInvalidateCalendarEntries } from '@/hooks/useCalendarEntries'
import { useAuthStore } from '@/lib/authStore'
import api from '@/lib/apiClient'
import type { TimeEntry } from '@/types'

interface FormValues {
  description: string
  projectId: string
  tagId: string
  startTime: string
  endTime: string
  billable: boolean
}

function toInputValue(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

interface CalendarEntryModalProps {
  mode: 'create' | 'edit'
  entry?: TimeEntry
  initialStart?: Date
  initialEnd?: Date
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
}

export default function CalendarEntryModal({
  mode,
  entry,
  initialStart,
  initialEnd,
  onClose,
  onSaved,
  onDeleted,
}: CalendarEntryModalProps) {
  const { user } = useAuthStore()
  const { data: projects = [] } = useProjects()
  const { data: tags = [] } = useTags()
  const invalidate = useInvalidateCalendarEntries()

  const isOwner = !entry || entry.userId === user?.id
  const isManagerOrAdmin = user?.role === 'MANAGER' || user?.role === 'ADMIN'
  const canEdit = isOwner || isManagerOrAdmin
  const isViewOnly = mode === 'edit' && !canEdit

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, reset } = useForm<FormValues>({
    defaultValues: {
      description: entry?.description ?? '',
      projectId: entry?.projectId ?? '',
      tagId: entry?.tagId ?? '',
      startTime: entry ? toInputValue(entry.startTime) : initialStart ? toInputValue(initialStart) : '',
      endTime: entry?.endTime ? toInputValue(entry.endTime) : initialEnd ? toInputValue(initialEnd) : '',
      billable: entry?.billable ?? false,
    },
  })

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const startVal = watch('startTime')

  const onSubmit = async (data: FormValues) => {
    if (!canEdit) return
    const payload = {
      description: data.description,
      projectId: data.projectId || null,
      tagId: data.tagId || null,
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
      billable: data.billable,
    }
    if (mode === 'create') {
      await api.post('/time-entries', payload)
    } else if (entry) {
      await api.put(`/time-entries/${entry.id}`, payload)
    }
    invalidate()
    onSaved()
  }

  const handleDelete = async () => {
    if (!entry) return
    const confirmed = window.confirm('Delete this time entry?')
    if (!confirmed) return
    await api.delete(`/time-entries/${entry.id}`)
    invalidate()
    onDeleted()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{ background: 'rgb(var(--bg-secondary))', border: '1px solid var(--border)' }}
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'create' ? 'Create time entry' : 'Edit time entry'}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'rgb(var(--text-base))' }}>
            {isViewOnly ? 'View entry' : mode === 'create' ? 'New time entry' : 'Edit time entry'}
          </h2>
          {isViewOnly && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: 'rgb(var(--text-muted))', background: 'rgb(var(--bg-primary))' }}>
              View only
            </span>
          )}
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all" style={{ color: 'rgb(var(--text-muted))' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--text-muted))' }}>Description</label>
            <input
              {...register('description')}
              disabled={isViewOnly}
              placeholder="What did you work on?"
              className="w-full rounded-lg px-3 py-2 text-sm transition-all"
              style={{ background: 'rgb(var(--bg-primary))', border: '1px solid var(--border)', color: 'rgb(var(--text-base))', outline: 'none' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--text-muted))' }}>Project</label>
            <select
              {...register('projectId')}
              disabled={isViewOnly}
              className="w-full rounded-lg px-3 py-2 text-sm transition-all"
              style={{ background: 'rgb(var(--bg-primary))', border: '1px solid var(--border)', color: 'rgb(var(--text-base))', outline: 'none' }}
            >
              <option value="">No project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--text-muted))' }}>Tag</label>
            <select
              {...register('tagId')}
              disabled={isViewOnly}
              className="w-full rounded-lg px-3 py-2 text-sm transition-all"
              style={{ background: 'rgb(var(--bg-primary))', border: '1px solid var(--border)', color: 'rgb(var(--text-base))', outline: 'none' }}
            >
              <option value="">No tag</option>
              {tags.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--text-muted))' }}>Start time</label>
              <input
                type="datetime-local"
                {...register('startTime', { required: 'Required' })}
                disabled={isViewOnly}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'rgb(var(--bg-primary))', border: `1px solid ${errors.startTime ? '#ef4444' : 'var(--border)'}`, color: 'rgb(var(--text-base))', outline: 'none' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--text-muted))' }}>End time</label>
              <input
                type="datetime-local"
                {...register('endTime', {
                  required: 'Required',
                  validate: val => !startVal || new Date(val) > new Date(startVal) || 'Must be after start',
                })}
                disabled={isViewOnly}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'rgb(var(--bg-primary))', border: `1px solid ${errors.endTime ? '#ef4444' : 'var(--border)'}`, color: 'rgb(var(--text-base))', outline: 'none' }}
              />
              {errors.endTime && <p className="text-[10px] mt-0.5 text-red-400">{errors.endTime.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billable"
              {...register('billable')}
              disabled={isViewOnly}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="billable" className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>Billable</label>
          </div>

          {!isViewOnly && (
            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              {mode === 'edit' && (isOwner || isManagerOrAdmin) ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-red-400/10 text-red-400"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              ) : <div />}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-white/5"
                  style={{ color: 'rgb(var(--text-muted))' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: 'rgb(var(--accent))' }}
                >
                  {isSubmitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
