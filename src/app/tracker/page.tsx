'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import TimerBar from '@/components/tracker/TimerBar'
import StatsRow from '@/components/tracker/StatsRow'
import EntryRow from '@/components/tracker/EntryRow'
import EntryModal from '@/components/tracker/EntryModal'
import { groupEntriesByDate, dateLabel, formatDuration } from '@/lib/utils'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { useProjects } from '@/hooks/useProjects'
import { useStats } from '@/hooks/useStats'
import type { TimeEntry } from '@/types'

export default function TrackerPage() {
  const [editEntry, setEditEntry] = useState<TimeEntry | null | undefined>(undefined)

  const { data: entries = [] } = useTimeEntries()
  const { data: projects = [] } = useProjects()
  const { data: stats } = useStats()

  const runningEntry = entries.find(e => e.isRunning) ?? null
  const finished = entries.filter(e => !e.isRunning)
  const groups = groupEntriesByDate(finished)
  const totalSecs = finished.reduce((s, e) => s + (e.duration ?? 0), 0)

  return (
    <AppShell>
      <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-white">Time Tracker</h1>
          <p className="text-xs text-white/40 mt-0.5 truncate">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={() => setEditEntry(null)}>
          <Plus size={14} /> Add Entry
        </button>
      </div>

      <div className="page-body">
        <div className="page-container">
          <TimerBar projects={projects} runningEntry={runningEntry} />
          <StatsRow stats={stats} />

          {/* Running entry banner */}
          {runningEntry && (
            <div className="flex flex-col gap-2 card px-4 py-3 mb-6 border-accent-green/30 bg-accent-green/5 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse flex-shrink-0" />
                <span className="text-sm text-white flex-1 truncate">{runningEntry.description || 'Timer running...'}</span>
              </div>
              {runningEntry.project && (
                <span className="text-xs text-white/50 flex items-center gap-1.5 sm:ml-auto">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: runningEntry.project.color }} />
                  <span className="truncate">{runningEntry.project.name}</span>
                </span>
              )}
            </div>
          )}

          {/* Entries list */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-[13.5px] font-semibold text-white">Time Entries</h2>
            <span className="text-xs text-white/40 whitespace-nowrap">Total: {formatDuration(totalSecs)}</span>
          </div>

          {Object.keys(groups).length === 0 ? (
            <div className="text-center py-16 sm:py-20 text-white/30">
              <div className="text-4xl mb-3">⏱</div>
              <p className="text-sm">No entries yet - start the timer!</p>
            </div>
          ) : (
            Object.entries(groups).map(([dateKey, dayEntries]) => (
              <div key={dateKey} className="mb-6">
                <div className="flex justify-between items-center gap-3 mb-2 px-0.5">
                  <span className="text-[11.5px] font-medium text-white/40">{dateLabel(dateKey)}</span>
                  <span className="text-[11.5px] text-white/40 whitespace-nowrap">
                    {formatDuration(dayEntries.reduce((s, e) => s + (e.duration ?? 0), 0))}
                  </span>
                </div>
                {dayEntries.map(e => <EntryRow key={e.id} entry={e} onEdit={setEditEntry} />)}
              </div>
            ))
          )}
        </div>
      </div>

      {editEntry !== undefined && (
        <EntryModal entry={editEntry} projects={projects} onClose={() => setEditEntry(undefined)} />
      )}
    </AppShell>
  )
}
