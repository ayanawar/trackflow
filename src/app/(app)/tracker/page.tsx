'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  Plus, ChevronLeft, ChevronRight, Send, CheckCircle2,
  AlertTriangle, Clock, DollarSign, X,
} from 'lucide-react'

import TimerBar from '@/components/tracker/TimerBar'
import EntryRow from '@/components/tracker/EntryRow'
import EntryModal from '@/components/tracker/EntryModal'
import { formatDuration } from '@/lib/utils'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { useProjects } from '@/hooks/useProjects'
import { useAuthStore } from '@/lib/authStore'
import { cn } from '@/lib/utils'
import type { TimeEntry } from '@/types'

const DAY_NAMES  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day   // shift to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function weekLabel(start: Date): string {
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const s = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const e = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${s} – ${e}`
}

export default function TrackerPage() {
  const [editEntry, setEditEntry]         = useState<TimeEntry | null | undefined>(undefined)
  const [weekOffset, setWeekOffset]       = useState(0)   // 0 = this week
  const [submittedWeeks, setSubmittedWeeks] = useState<Set<string>>(new Set())
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [alertDismissed, setAlertDismissed]  = useState(false)

  const { user } = useAuthStore()
  const dailyGoal  = (user?.dailyHoursGoal ?? 8) * 3600
  const weekGoal   = dailyGoal * 5

  const { data: entries = [] } = useTimeEntries(500)
  const { data: projects = [] } = useProjects()

  // Load submitted weeks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tf_submitted_weeks')
      if (saved) setSubmittedWeeks(new Set(JSON.parse(saved)))
    } catch {}
  }, [])

  // ── Week bounds ────────────────────────────────────────────────────────────
  const weekStart = useMemo(() => {
    const d = getWeekStart(new Date())
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [weekOffset])

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 6)
    d.setHours(23, 59, 59, 999)
    return d
  }, [weekStart])

  const weekKey       = weekStart.toISOString().split('T')[0]
  const isCurrentWeek = weekOffset === 0
  const isSubmitted   = submittedWeeks.has(weekKey)

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    }), [weekStart])

  // ── Filter & group entries ─────────────────────────────────────────────────
  const weekEntries = useMemo(() =>
    entries.filter(e => {
      const t = new Date(e.startTime).getTime()
      return t >= weekStart.getTime() && t <= weekEnd.getTime()
    }), [entries, weekStart, weekEnd])

  const entriesByDay = useMemo(() => {
    const map: Record<number, TimeEntry[]> = { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] }
    weekEntries.forEach(e => {
      const dow = new Date(e.startTime).getDay()        // 0=Sun … 6=Sat
      const idx = dow === 0 ? 6 : dow - 1               // Mon=0 … Sun=6
      map[idx].push(e)
    })
    return map
  }, [weekEntries])

  const finishedEntries = weekEntries.filter(e => !e.isRunning && !e.isPaused)
  const weekTotalSecs   = finishedEntries.reduce((s, e) => s + (e.duration ?? 0), 0)
  const weekPct         = Math.min(100, Math.round(weekTotalSecs / weekGoal * 100))
  const isOver40h       = weekTotalSecs >= weekGoal
  const weekHoursLabel  = `${(user?.dailyHoursGoal ?? 8) * 5}h`
  const runningEntry    = entries.find(e => e.isRunning || e.isPaused) ?? null

  const billableSecs    = finishedEntries.filter(e => e.billable).reduce((s, e) => s + (e.duration ?? 0), 0)

  // Alert: show banner when ≥ 40h and not yet submitted/dismissed
  const showAlert = isCurrentWeek && isOver40h && !isSubmitted && !alertDismissed

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const updated = new Set(Array.from(submittedWeeks).concat(weekKey))
    setSubmittedWeeks(updated)
    try { localStorage.setItem('tf_submitted_weeks', JSON.stringify(Array.from(updated))) } catch {}
    setShowSubmitModal(false)
    setAlertDismissed(false)
  }

  // ── Progress colour ────────────────────────────────────────────────────────
  const barColor = weekPct < 75 ? '#4f8ef7' : weekPct < 100 ? '#fbbf24' : '#34d399'

  return (<>
    
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-white">Time Tracker</h1>
          <p className="text-xs text-white/40 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={() => setEditEntry(null)}>
          <Plus size={14} /> Add Entry
        </button>
      </div>

      <div className="page-body">
        <div className="page-container space-y-5">

          {/* ── Timer bar (current week only) ─────────────────────────────── */}
          {isCurrentWeek && <TimerBar projects={projects} runningEntry={runningEntry} />}

          {/* ── 40h Alert banner ──────────────────────────────────────────── */}
          {showAlert && (
            <div className="relative flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5 px-5 py-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={16} className="text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-300">You&apos;ve reached {weekHoursLabel} this week!</p>
                  <p className="text-xs text-amber-400/60 mt-0.5">Submit your timesheet to log this week&apos;s completed work.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setAlertDismissed(true)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                >
                  <X size={13} />
                </button>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                >
                  <Send size={12} /> Submit Now
                </button>
              </div>
            </div>
          )}

          {/* ── Weekly summary card ───────────────────────────────────────── */}
          <div className="card overflow-hidden">
            {/* Week nav */}
            <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWeekOffset(v => v - 1)}
                  className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:border-white/20 transition-all"
                >
                  <ChevronLeft size={13} className="text-white/50" />
                </button>
                <span className="text-sm font-semibold text-white">{weekLabel(weekStart)}</span>
                <button
                  onClick={() => setWeekOffset(v => v + 1)}
                  disabled={isCurrentWeek}
                  className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={13} className="text-white/50" />
                </button>
                {!isCurrentWeek && (
                  <button onClick={() => setWeekOffset(0)} className="text-xs text-accent hover:underline ml-1">
                    This week
                  </button>
                )}
              </div>

              {isSubmitted ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full font-medium">
                  <CheckCircle2 size={12} /> Submitted
                </span>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 hover:border-accent/40 hover:text-accent text-white/50 px-3 py-1.5 rounded-xl transition-all"
                >
                  <Send size={11} /> Submit timesheet
                </button>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.06]">
              {[
                { label: 'Total hours', value: formatDuration(weekTotalSecs), color: barColor },
                { label: 'Billable', value: formatDuration(billableSecs), color: '#34d399' },
                { label: 'Entries', value: String(finishedEntries.length), color: '#7c6fef' },
              ].map(({ label, value, color }) => (
                <div key={label} className="px-5 py-4">
                  <p className="text-[11px] text-white/40 uppercase tracking-widest font-medium mb-1">{label}</p>
                  <p className="text-xl font-mono font-semibold" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <div className="flex justify-between text-[11px] text-white/40 mb-1.5">
                <span>Weekly goal — {weekHoursLabel} ({weekPct}%)</span>
                <span className="font-mono" style={{ color: barColor }}>{formatDuration(weekTotalSecs)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${weekPct}%`, background: barColor }}
                />
              </div>
            </div>

            {/* 7-day mini chart */}
            <div className="grid grid-cols-7 gap-2 px-4 py-4">
              {weekDays.map((day, i) => {
                const dayEntries = (entriesByDay[i] ?? []).filter(e => !e.isRunning && !e.isPaused)
                const daySecs    = dayEntries.reduce((s, e) => s + (e.duration ?? 0), 0)
                const dayPct     = Math.min(100, (daySecs / dailyGoal) * 100)
                const isToday    = day.toDateString() === new Date().toDateString()
                const isWeekend  = i >= 5

                return (
                  <div
                    key={i}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl py-2.5 px-1 transition-all',
                      isToday
                        ? 'bg-accent/10 border border-accent/25'
                        : 'bg-white/[0.025] border border-white/[0.05]',
                      isWeekend && !isToday && 'opacity-50'
                    )}
                  >
                    <span className={cn('text-[9px] font-bold uppercase tracking-wider', isToday ? 'text-accent' : 'text-white/35')}>
                      {DAY_SHORT[i]}
                    </span>
                    <span className={cn('text-[11px] font-semibold', isToday ? 'text-white' : 'text-white/50')}>
                      {day.getDate()}
                    </span>

                    {/* Bar */}
                    <div className="w-full h-10 flex items-end rounded-sm overflow-hidden bg-white/[0.04]">
                      {daySecs > 0 && (
                        <div
                          className="w-full rounded-sm transition-all duration-700"
                          style={{
                            height: `${Math.max(dayPct, 6)}%`,
                            background: isToday ? '#34d399' : '#4f8ef7',
                            opacity: isToday ? 1 : 0.65,
                          }}
                        />
                      )}
                    </div>

                    <span className={cn('text-[9px] font-mono', daySecs > 0 ? 'text-white/50' : 'text-white/15')}>
                      {daySecs > 0 ? formatDuration(daySecs) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Running entry banner ──────────────────────────────────────── */}
          {isCurrentWeek && runningEntry && (
            <div className="flex flex-col gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="text-sm text-white truncate">
                  {runningEntry.description || 'Timer running…'}
                </span>
                {runningEntry.isPaused && (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                    paused
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {runningEntry.billable && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <DollarSign size={10} /> Billable
                  </span>
                )}
                {runningEntry.project && (
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: runningEntry.project.color }} />
                    {runningEntry.project.name}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Daily sections ────────────────────────────────────────────── */}
          <div className="space-y-3">
            {[...weekDays].reverse().map((day, _ri) => {
              const i             = 6 - _ri
              const allDayEntries = entriesByDay[i] ?? []
              const dayEntries    = allDayEntries.filter(e => !e.isRunning && !e.isPaused)
              const daySecs       = dayEntries.reduce((s, e) => s + (e.duration ?? 0), 0)
              const dayBillable   = dayEntries.filter(e => e.billable).reduce((s, e) => s + (e.duration ?? 0), 0)
              const isToday       = day.toDateString() === new Date().toDateString()
              const isWeekend     = i >= 5

              // Hide empty past/future days (keep today always visible)
              if (dayEntries.length === 0 && !isToday) return null

              return (
                <div
                  key={i}
                  className={cn(
                    'rounded-2xl border overflow-hidden',
                    isToday ? 'border-accent/25 shadow-[0_0_0_1px_rgba(79,142,247,0.08)]' : 'border-white/[0.07]',
                    isWeekend && !isToday && 'opacity-80'
                  )}
                >
                  {/* Day header */}
                  <div className={cn(
                    'flex items-center justify-between gap-3 px-4 py-3',
                    isToday ? 'bg-accent/[0.06]' : 'bg-white/[0.02]'
                  )}>
                    <div className="flex items-center gap-2.5">
                      {isToday && (
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse flex-shrink-0" />
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className={cn('text-sm font-semibold', isToday ? 'text-accent' : 'text-white/75')}>
                          {isToday ? 'Today' : DAY_NAMES[i]}
                        </span>
                        <span className="text-xs text-white/30">
                          {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {dayBillable > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400/70">
                          <DollarSign size={10} />{formatDuration(dayBillable)}
                        </span>
                      )}
                      {daySecs > 0 && (
                        <span className={cn(
                          'text-xs font-mono font-semibold px-2.5 py-1 rounded-lg',
                          isToday ? 'bg-accent/10 text-accent' : 'bg-white/5 text-white/55'
                        )}>
                          {formatDuration(daySecs)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Entries */}
                  {dayEntries.length === 0 ? (
                    <div className="px-4 py-6 flex flex-col items-center gap-2 text-white/20">
                      <Clock size={20} className="opacity-30" />
                      <p className="text-xs">No entries yet — start tracking!</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {dayEntries.map(e => (
                        <EntryRow key={e.id} entry={e} onEdit={setEditEntry} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Empty state for full week */}
            {finishedEntries.length === 0 && (
              <div className="text-center py-20 text-white/20">
                <Clock size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No entries this week</p>
                <p className="text-xs mt-1 text-white/15">Start the timer or add an entry to get going</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Submit modal ──────────────────────────────────────────────────── */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && setShowSubmitModal(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[rgb(var(--bg-secondary))] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Send size={20} className="text-accent" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Submit Timesheet</h2>
                <p className="text-xs text-white/35 mt-0.5">{weekLabel(weekStart)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] divide-y divide-white/[0.06] mb-5 overflow-hidden">
              {[
                { label: 'Total hours',    value: formatDuration(weekTotalSecs), color: barColor },
                { label: 'Billable hours', value: formatDuration(billableSecs),  color: '#34d399' },
                { label: 'Entries logged', value: String(finishedEntries.length), color: 'white' },
                {
                  label: 'Goal progress',
                  value: `${weekPct}% of ${weekHoursLabel}`,
                  color: isOver40h ? '#34d399' : '#fbbf24',
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-white/45">{label}</span>
                  <span className="text-sm font-mono font-semibold" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>

            {!isOver40h && (
              <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
                You haven&apos;t reached {weekHoursLabel} yet. You can still submit, but consider adding more entries first.
              </p>
            )}

            <div className="flex gap-2">
              <button onClick={() => setShowSubmitModal(false)} className="btn-ghost flex-1">
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn-primary flex-1 gap-1.5">
                <Send size={13} /> Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {editEntry !== undefined && (
        <EntryModal entry={editEntry} projects={projects} onClose={() => setEditEntry(undefined)} />
      )}
    
  </>
  )
}
