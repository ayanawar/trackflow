'use client'
import { DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { LayoutEntry } from './calendarUtils'
import type { TimeEntry } from '@/types'

interface CalendarEntryBlockProps {
  layoutEntry: LayoutEntry
  onEdit: (entry: TimeEntry) => void
  dragHandleProps?: Record<string, unknown>
  isDragging?: boolean
}

function formatDur(seconds: number | null): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function CalendarEntryBlock({
  layoutEntry,
  onEdit,
  dragHandleProps,
  isDragging,
}: CalendarEntryBlockProps) {
  const { entry, topPercent, heightPercent, columnIndex, columnCount } = layoutEntry
  const color = entry.project?.color ?? '#4f8ef7'

  const left = `${(columnIndex / columnCount) * 100}%`
  const width = `${(1 / columnCount) * 100}%`

  const durationLabel = formatDur(entry.duration)
  const startLabel = format(new Date(entry.startTime), 'h:mm a')
  const ariaLabel = `${entry.project?.name ?? 'No project'} · ${durationLabel} · starts ${startLabel}`

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(entry)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    // Prevent drag from triggering click
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) return
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={handleClick}
      onPointerUp={handlePointerUp}
      onKeyDown={e => e.key === 'Enter' && onEdit(entry)}
      className={cn(
        'absolute rounded-md px-2 py-1 text-xs overflow-hidden cursor-pointer select-none transition-opacity group',
        isDragging && 'opacity-60 z-50',
        entry.isRunning && 'animate-pulse-border',
      )}
      style={{
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
        left,
        width,
        backgroundColor: `${color}33`,
        borderLeft: `3px solid ${color}`,
        color: 'rgb(var(--text-base))',
        minHeight: '24px',
      }}
      {...(dragHandleProps ?? {})}
      data-entry-id={entry.id}
    >
      <div className="flex items-start justify-between gap-1 leading-tight">
        <span className="font-medium truncate" style={{ color }}>
          {entry.project?.name ?? 'No project'}
        </span>
        {entry.billable && <DollarSign size={10} className="shrink-0 mt-0.5" style={{ color }} />}
      </div>
      {entry.description && (
        <span className="truncate block opacity-80" style={{ color: 'rgb(var(--text-muted))' }}>
          {entry.description}
        </span>
      )}
      {durationLabel && (
        <span className="block opacity-70 text-[10px]" style={{ color: 'rgb(var(--text-faint))' }}>
          {durationLabel}
        </span>
      )}
      {entry.isRunning && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      )}
    </div>
  )
}
