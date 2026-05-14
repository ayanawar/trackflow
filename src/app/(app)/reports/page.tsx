'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Filter } from 'lucide-react'
import api from '@/lib/apiClient'

import { formatDuration, formatTimeRange } from '@/lib/utils'
import { useAuthStore } from '@/lib/authStore'
import type { TimeEntry, Project } from '@/types'

type Range = '7' | '30' | '90'

export default function ReportsPage() {
  const [range, setRange] = useState<Range>('7')
  const [projectFilter, setProjectFilter] = useState('')
  const { user } = useAuthStore()

  const { data: entries = [] } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries', 'all'],
    queryFn: () => api.get('/time-entries?limit=500').then(r => r.data),
  })

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
  })

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - Number(range))

  const filtered = entries.filter(e => {
    const inRange = new Date(e.startTime) >= cutoff
    const inProject = !projectFilter || e.projectId === projectFilter
    return inRange && inProject && !e.isRunning
  })

  const totalSecs = filtered.reduce((s, e) => s + (e.duration ?? 0), 0)
  const scopeLabel = user?.role === 'ADMIN'
    ? 'All workspace entries'
    : user?.role === 'MANAGER'
      ? 'Assigned team and project entries'
      : 'Your entries'

  // Group by project for summary
  const byProject: Record<string, { project: Project | null; seconds: number; count: number }> = {}
  filtered.forEach(e => {
    const key = e.projectId ?? 'none'
    if (!byProject[key]) byProject[key] = { project: e.project ?? null, seconds: 0, count: 0 }
    byProject[key].seconds += e.duration ?? 0
    byProject[key].count += 1
  })

  const exportCSV = () => {
    const header = 'Description,Project,Client,Tag,Start,End,Duration (min)\n'
    const rows = filtered.map(e => [
      `"${(e.description ?? '').replace(/"/g, '""')}"`,
      `"${e.project?.name ?? ''}"`,
      `"${e.project?.client ?? ''}"`,
      `"${e.tag?.name ?? ''}"`,
      new Date(e.startTime).toLocaleString(),
      e.endTime ? new Date(e.endTime).toLocaleString() : '',
      Math.round((e.duration ?? 0) / 60),
    ].join(','))
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `trackflow-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (<>
    
      <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-white">Reports</h1>
          <p className="text-xs text-white/40 mt-0.5">{scopeLabel} · {filtered.length} entries · {formatDuration(totalSecs)}</p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={exportCSV}><Download size={14} /> Export CSV</button>
      </div>

      <div className="page-body">
        <div className="page-container">
        {/* Filters */}
        <div className="flex items-stretch gap-3 mb-7 flex-col sm:flex-row sm:items-center sm:flex-wrap">
          <Filter size={13} className="text-white/40" />
          <div className="grid grid-cols-3 gap-1.5 sm:flex">
            {(['7', '30', '90'] as Range[]).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`min-h-9 px-3 py-1.5 rounded-lg text-xs transition-all ${range === r ? 'bg-accent text-white' : 'bg-white/5 text-white/50 hover:text-white border border-white/10'}`}>
                Last {r} days
              </button>
            ))}
          </div>
          <select className="input w-full py-1.5 text-xs sm:w-44" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
            <option value="">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Summary cards */}
        {Object.values(byProject).length > 0 && (
          <div className="grid grid-cols-1 gap-4 mb-7 md:grid-cols-3">
            {Object.values(byProject).sort((a, b) => b.seconds - a.seconds).map(({ project, seconds, count }) => (
              <div key={project?.id ?? 'none'} className="stat-card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: project?.color ?? '#555' }} />
                  <span className="text-xs text-white/60 truncate">{project?.name ?? 'No project'}</span>
                </div>
                <div className="text-xl sm:text-2xl font-mono font-semibold text-white break-words">{formatDuration(seconds)}</div>
                <div className="text-xs text-white/30 mt-1">{count} entries</div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="table-scroll">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Description', 'Project', 'Tag', 'Time Range', 'Duration'].map(h => (
                  <th key={h} className="text-left text-[11px] font-medium text-white/30 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-14 text-white/30 text-xs">No entries in this period</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white max-w-[200px] truncate">{e.description || '—'}</td>
                  <td className="px-4 py-3">
                    {e.project
                      ? <span className="flex items-center gap-1.5 text-white/60"><span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: e.project.color }} /><span className="truncate">{e.project.name}</span></span>
                      : <span className="text-white/30">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {e.tag
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">{e.tag.name}</span>
                      : <span className="text-white/30">—</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white/40">{formatTimeRange(e.startTime, e.endTime)}</td>
                  <td className="px-4 py-3 font-mono text-sm font-medium text-white">{formatDuration(e.duration ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        </div>
      </div>
    
  </>
  )
}
