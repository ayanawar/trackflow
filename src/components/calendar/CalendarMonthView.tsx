'use client'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday } from 'date-fns'
import { formatDurationHM, toDateKey } from './calendarUtils'
import type { TimeEntry } from '@/types'
import { useMemo } from 'react'

interface DaySummary {
  count: number
  totalSeconds: number
}

interface CalendarMonthViewProps {
  entries: TimeEntry[]
  currentDate: Date
  onDayClick: (date: Date) => void
}

export default function CalendarMonthView({ entries, currentDate, onDayClick }: CalendarMonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const summaries = useMemo(() => {
    const map: Record<string, DaySummary> = {}
    for (const entry of entries) {
      if (!entry.endTime || !entry.duration) continue
      const key = toDateKey(new Date(entry.startTime))
      if (!map[key]) map[key] = { count: 0, totalSeconds: 0 }
      map[key].count++
      map[key].totalSeconds += entry.duration
    }
    return map
  }, [entries])

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Weekday header */}
      <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)', background: 'rgb(var(--bg-secondary))' }}>
        {DAY_LABELS.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-medium uppercase tracking-wide" style={{ color: 'rgb(var(--text-faint))' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const key = toDateKey(day)
          const summary = summaries[key]
          const inMonth = isSameMonth(day, currentDate)
          const today = isToday(day)

          return (
            <button
              key={i}
              onClick={() => onDayClick(day)}
              className="min-h-[80px] p-2 text-left transition-all hover:bg-white/5 focus:outline-none"
              style={{
                borderTop: i >= 7 ? '1px solid var(--border)' : undefined,
                borderLeft: i % 7 !== 0 ? '1px solid var(--border)' : undefined,
                opacity: inMonth ? 1 : 0.35,
              }}
            >
              <span
                className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-semibold ${today ? 'text-white' : ''}`}
                style={today ? { background: 'rgb(var(--accent))' } : { color: 'rgb(var(--text-muted))' }}
              >
                {format(day, 'd')}
              </span>
              {summary && (
                <div className="mt-1.5 space-y-0.5">
                  <div className="text-[10px] font-medium" style={{ color: 'rgb(var(--accent))' }}>
                    {summary.count} {summary.count === 1 ? 'entry' : 'entries'}
                  </div>
                  <div className="text-[10px]" style={{ color: 'rgb(var(--text-faint))' }}>
                    {formatDurationHM(summary.totalSeconds)}
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
