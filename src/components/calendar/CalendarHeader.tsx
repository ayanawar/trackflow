'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { cn } from '@/lib/utils'

type CalendarView = 'week' | 'day' | 'month'

interface CalendarHeaderProps {
  view: CalendarView
  date: Date
  onViewChange: (view: CalendarView) => void
  onNavigate: (direction: -1 | 1) => void
  onToday: () => void
}

function formatPeriodLabel(view: CalendarView, date: Date): string {
  if (view === 'day') return format(date, 'EEEE, MMMM d, yyyy')
  if (view === 'week') {
    const start = startOfWeek(date, { weekStartsOn: 1 })
    const end = endOfWeek(date, { weekStartsOn: 1 })
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`
    }
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
  }
  return format(date, 'MMMM yyyy')
}

const VIEWS: CalendarView[] = ['week', 'day', 'month']

export default function CalendarHeader({ view, date, onViewChange, onNavigate, onToday }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate(-1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
          style={{ color: 'rgb(var(--text-muted))', border: '1px solid var(--border)' }}
          aria-label="Previous"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => onNavigate(1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
          style={{ color: 'rgb(var(--text-muted))', border: '1px solid var(--border)' }}
          aria-label="Next"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={onToday}
          className="px-3 h-8 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
          style={{ color: 'rgb(var(--text-muted))', border: '1px solid var(--border)' }}
        >
          Today
        </button>
        <span className="text-sm font-semibold ml-1" style={{ color: 'rgb(var(--text-base))' }}>
          {formatPeriodLabel(view, date)}
        </span>
      </div>

      <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {VIEWS.map(v => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={cn(
              'px-3 h-8 text-sm font-medium capitalize transition-all',
              view === v
                ? 'text-white'
                : 'hover:bg-white/5'
            )}
            style={
              view === v
                ? { background: 'rgb(var(--accent))', color: 'white' }
                : { color: 'rgb(var(--text-muted))' }
            }
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
