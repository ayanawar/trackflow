'use client'
import { useState } from 'react'
import { startOfWeek, endOfWeek, format, addWeeks, addDays, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { CalendarDays, RefreshCw, Loader2 } from 'lucide-react'
import CalendarHeader from '@/components/calendar/CalendarHeader'
import CalendarWeekView from '@/components/calendar/CalendarWeekView'
import CalendarDayView from '@/components/calendar/CalendarDayView'
import CalendarMonthView from '@/components/calendar/CalendarMonthView'
import CalendarEntryModal from '@/components/calendar/CalendarEntryModal'
import MemberFilter from '@/components/calendar/MemberFilter'
import { useCalendarEntries } from '@/hooks/useCalendarEntries'
import { useAuthStore } from '@/lib/authStore'
import api from '@/lib/apiClient'
import type { TimeEntry } from '@/types'

type CalendarView = 'week' | 'day' | 'month'

function getDateRange(view: CalendarView, date: Date): { startDate: string; endDate: string } {
  if (view === 'week') {
    const s = startOfWeek(date, { weekStartsOn: 1 })
    const e = endOfWeek(date, { weekStartsOn: 1 })
    return { startDate: format(s, 'yyyy-MM-dd'), endDate: format(e, 'yyyy-MM-dd') }
  }
  if (view === 'day') {
    const d = format(date, 'yyyy-MM-dd')
    return { startDate: d, endDate: d }
  }
  // month
  const s = startOfMonth(date)
  const e = endOfMonth(date)
  return { startDate: format(s, 'yyyy-MM-dd'), endDate: format(e, 'yyyy-MM-dd') }
}

function navigateDate(view: CalendarView, date: Date, dir: -1 | 1): Date {
  if (view === 'week') return addWeeks(date, dir)
  if (view === 'day') return addDays(date, dir)
  return addMonths(date, dir)
}

export default function CalendarPage() {
  const { user } = useAuthStore()
  const [activeView, setActiveView] = useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>()
  const [modalState, setModalState] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    entry?: TimeEntry
    initialStart?: Date
    initialEnd?: Date
  }>({ open: false, mode: 'create' })

  const isManagerOrAdmin = user?.role === 'MANAGER' || user?.role === 'ADMIN'
  const { startDate, endDate } = getDateRange(activeView, currentDate)

  const { data: entries = [], isLoading, isError, refetch } = useCalendarEntries({
    startDate,
    endDate,
    userId: selectedUserId,
  })

  const handleNavigate = (dir: -1 | 1) => setCurrentDate(d => navigateDate(activeView, d, dir))
  const handleToday = () => setCurrentDate(new Date())

  const handleCreateEntry = (startTime: Date, endTime: Date) => {
    setModalState({ open: true, mode: 'create', initialStart: startTime, initialEnd: endTime })
  }

  const handleEditEntry = (entry: TimeEntry) => {
    setModalState({ open: true, mode: 'edit', entry })
  }

  const handleReschedule = async (entry: TimeEntry, newStart: Date, newEnd: Date) => {
    const original = { startTime: entry.startTime, endTime: entry.endTime }
    try {
      await api.put(`/time-entries/${entry.id}`, {
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
      })
      refetch()
    } catch {
      // revert handled by optimistic update in CalendarWeekView — here we just re-fetch to correct state
      refetch()
    }
  }

  const handleDayClick = (date: Date) => {
    setCurrentDate(date)
    setActiveView('day')
  }

  return (
    <>
      <div className="page-header flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl animated-gradient flex items-center justify-center shadow-lg">
            <CalendarDays size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--text-base))' }}>Calendar</h1>
            <p className="text-xs" style={{ color: 'rgb(var(--text-faint))' }}>View and manage your time entries</p>
          </div>
        </div>

        {isManagerOrAdmin && (
          <MemberFilter
            selectedUserId={selectedUserId}
            onSelect={setSelectedUserId}
          />
        )}
      </div>

      <div className="page-body">
        <div className="page-container">
          <div className="mb-4">
            <CalendarHeader
              view={activeView}
              date={currentDate}
              onViewChange={setActiveView}
              onNavigate={handleNavigate}
              onToday={handleToday}
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20 gap-2" style={{ color: 'rgb(var(--text-muted))' }}>
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading entries…</span>
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center py-20 gap-3 flex-col">
              <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>Failed to load calendar entries.</p>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
                style={{ color: 'rgb(var(--accent))', border: '1px solid rgb(var(--accent) / 0.4)' }}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && activeView === 'week' && (
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <CalendarWeekView
                entries={entries}
                currentDate={currentDate}
                onEditEntry={handleEditEntry}
                onCreateEntry={handleCreateEntry}
                onReschedule={handleReschedule}
              />
              {entries.length === 0 && (
                <div className="py-12 text-center text-sm" style={{ color: 'rgb(var(--text-faint))' }}>
                  No time entries this week. Click any time slot to create one.
                </div>
              )}
            </div>
          )}

          {!isLoading && !isError && activeView === 'day' && (
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <CalendarDayView
                entries={entries}
                currentDate={currentDate}
                onEditEntry={handleEditEntry}
                onCreateEntry={handleCreateEntry}
                onNavigate={handleNavigate}
              />
              {entries.length === 0 && (
                <div className="py-12 text-center text-sm" style={{ color: 'rgb(var(--text-faint))' }}>
                  No time entries today. Click any time slot to create one.
                </div>
              )}
            </div>
          )}

          {!isLoading && !isError && activeView === 'month' && (
            <CalendarMonthView
              entries={entries}
              currentDate={currentDate}
              onDayClick={handleDayClick}
            />
          )}
        </div>
      </div>

      {modalState.open && (
        <CalendarEntryModal
          mode={modalState.mode}
          entry={modalState.entry}
          initialStart={modalState.initialStart}
          initialEnd={modalState.initialEnd}
          onClose={() => setModalState(s => ({ ...s, open: false }))}
          onSaved={() => {
            setModalState(s => ({ ...s, open: false }))
            refetch()
          }}
          onDeleted={() => {
            setModalState(s => ({ ...s, open: false }))
            refetch()
          }}
        />
      )}
    </>
  )
}
