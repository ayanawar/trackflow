'use client'
import { startOfDay, format } from 'date-fns'
import { computeLayoutEntries } from './calendarUtils'
import CalendarEntryBlock from './CalendarEntryBlock'
import type { TimeEntry } from '@/types'
import { useRef } from 'react'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface CalendarDayViewProps {
  entries: TimeEntry[]
  currentDate: Date
  onEditEntry: (entry: TimeEntry) => void
  onCreateEntry: (startTime: Date, endTime: Date) => void
  onNavigate: (dir: -1 | 1) => void
}

export default function CalendarDayView({
  entries,
  currentDate,
  onEditEntry,
  onCreateEntry,
}: CalendarDayViewProps) {
  const colRef = useRef<HTMLDivElement>(null)
  const dayStart = startOfDay(currentDate)

  const layoutEntries = computeLayoutEntries(entries, dayStart)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-entry-id]')) return
    const rect = colRef.current?.getBoundingClientRect()
    if (!rect) return
    const y = e.clientY - rect.top
    const minutesIntoDay = Math.floor((y / rect.height) * 1440)
    const snappedMinutes = Math.round(minutesIntoDay / 15) * 15
    const startTime = new Date(dayStart.getTime() + snappedMinutes * 60000)
    const endTime = new Date(startTime.getTime() + 60 * 60000)
    onCreateEntry(startTime, endTime)
  }

  return (
    <div>
      {/* Day header */}
      <div
        className="px-4 py-3 text-sm font-semibold sticky top-0 z-10"
        style={{ borderBottom: '1px solid var(--border)', background: 'rgb(var(--bg-secondary))', color: 'rgb(var(--text-base))' }}
      >
        {format(currentDate, 'EEEE, MMMM d, yyyy')}
      </div>

      {/* Scrollable timeline */}
      <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        <div className="grid" style={{ gridTemplateColumns: '56px 1fr', minHeight: '1440px' }}>
          {/* Time gutter */}
          <div className="relative">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute w-full pr-2 text-right text-[10px]"
                style={{ top: `${(h / 24) * 100}%`, color: 'rgb(var(--text-faint))', transform: 'translateY(-50%)' }}
              >
                {h === 0 ? '' : format(new Date(2000, 0, 1, h), 'h a')}
              </div>
            ))}
          </div>

          {/* Single day column */}
          <div
            ref={colRef}
            className="relative border-l cursor-crosshair"
            style={{ borderColor: 'var(--border)', minHeight: '1440px' }}
            onClick={handleClick}
          >
            {/* Hour grid lines */}
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute w-full"
                style={{ top: `${(h / 24) * 100}%`, borderTop: '1px solid var(--border)', opacity: 0.4 }}
              />
            ))}
            {layoutEntries.map(le => (
              <CalendarEntryBlock
                key={le.entry.id}
                layoutEntry={le}
                onEdit={onEditEntry}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
