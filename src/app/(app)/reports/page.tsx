'use client'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  RadialBarChart, RadialBar, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import {
  Download, Clock, DollarSign, TrendingUp, Users,
  BarChart2, List, Calendar, Zap,
} from 'lucide-react'
import api from '@/lib/apiClient'
import { formatDuration, formatTimeRange } from '@/lib/utils'
import { useAuthStore } from '@/lib/authStore'
import { useTags } from '@/hooks/useTags'
import { useProjects } from '@/hooks/useProjects'
import { cn } from '@/lib/utils'
import type { TimeEntry } from '@/types'

type Range = '7' | '30' | '90' | '365'
type Tab   = 'overview' | 'entries'

interface AnalyticsData {
  range: number
  totalSeconds: number
  billableSeconds: number
  nonBillableSeconds: number
  entryCount: number
  avgDailySeconds: number
  mostActiveDay: string | null
  dailyTotals: { date: string; seconds: number; billableSeconds: number }[]
  projectBreakdown: { id: string; name: string; color: string; seconds: number; billableSeconds: number; percentage: number }[]
  tagBreakdown: { id: string; name: string; color: string; seconds: number }[]
  teamBreakdown: { userId: string; name: string; seconds: number; billableSeconds: number }[]
}

const fmtH = (s: number) => `${(s / 3600).toFixed(1)}h`

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-white/40 uppercase tracking-widest font-medium mb-0.5">{label}</p>
        <p className="text-xl font-mono font-semibold text-white">{value}</p>
        {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RadialTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-xl border border-white/10 px-3.5 py-3 shadow-2xl space-y-1" style={{ background: 'rgb(var(--bg-elevated))' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: d.payload.fill }}>{d.payload.name}</p>
      <p className="text-base font-mono font-semibold text-white">{formatDuration(d.value)}</p>
      <p className="text-[10px] text-white/35">{d.payload.pct}% of period</p>
    </div>
  )
}

export default function ReportsPage() {
  const [range, setRange]               = useState<Range>('30')
  const [tab, setTab]                   = useState<Tab>('overview')
  const [projectFilter, setProjectFilter] = useState('')
  const [tagFilter, setTagFilter]         = useState('')
  const { user } = useAuthStore()
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics', range],
    queryFn: () => api.get(`/analytics?range=${range}`).then(r => r.data),
  })

  const { data: entries = [], isLoading: entriesLoading } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries', 'all'],
    queryFn: () => api.get('/time-entries?limit=500').then(r => r.data),
    enabled: tab === 'entries',
  })

  const { data: projects = [] } = useProjects()
  const { data: tags = [] }     = useTags()

  const cutoff = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - Number(range))
    return d
  }, [range])

  const filteredEntries = useMemo(() => entries.filter(e => {
    const inRange   = new Date(e.startTime) >= cutoff
    const inProject = !projectFilter || e.projectId === projectFilter
    const inTag     = !tagFilter    || e.tagId     === tagFilter
    return inRange && inProject && inTag && !e.isRunning
  }), [entries, cutoff, projectFilter, tagFilter])

  const exportCSV = () => {
    const header = 'Description,Project,Tag,Task,Start,End,Duration (min)\n'
    const rows = filteredEntries.map(e => [
      `"${(e.description ?? '').replace(/"/g, '""')}"`,
      `"${e.project?.name ?? ''}"`,
      `"${e.tag?.name ?? ''}"`,
      `"${e.task ? `#${e.task.id.slice(0,7)} ${e.task.title}` : ''}"`,
      new Date(e.startTime).toLocaleString(),
      e.endTime ? new Date(e.endTime).toLocaleString() : '',
      Math.round((e.duration ?? 0) / 60),
    ].join(','))
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `trackflow-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  // Radial chart — bucket into ≤12 segments with ring colors
  const radialChartData = useMemo(() => {
    if (!analytics) return []
    const raw = analytics.dailyTotals

    // Determine bucket size based on range
    let bucketDays = 1          // 7d  → daily
    if (raw.length > 7)   bucketDays = 7   // 30d → weekly
    if (raw.length > 60)  bucketDays = 30  // 90d → monthly-ish
    if (raw.length > 180) bucketDays = 30  // 365d → monthly

    const buckets: { label: string; seconds: number }[] = []
    for (let i = 0; i < raw.length; i += bucketDays) {
      const chunk = raw.slice(i, i + bucketDays)
      const secs  = chunk.reduce((s, d) => s + d.seconds, 0)
      const start = new Date(chunk[0].date)
      const label = bucketDays === 1
        ? start.toLocaleDateString('en-US', { weekday: 'short' })
        : bucketDays === 7
          ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : start.toLocaleDateString('en-US', { month: 'short' })
      buckets.push({ label, seconds: secs })
    }

    // Keep only non-zero, max 12
    const active = buckets.filter(b => b.seconds > 0).slice(-12)

    // Color gradient: indigo → violet → teal
    const palette = ['#6366f1','#7c6fef','#8b5cf6','#a855f7','#c084fc','#818cf8','#60a5fa','#34d399','#10b981']
    const total = active.reduce((s, b) => s + b.seconds, 0)
    return active.map((b, i) => ({
      name:  b.label,
      value: b.seconds,
      fill:  palette[i % palette.length],
      pct:   total > 0 ? Math.round((b.seconds / total) * 100) : 0,
    }))
  }, [analytics])

  const billablePct = analytics && analytics.totalSeconds > 0
    ? Math.round((analytics.billableSeconds / analytics.totalSeconds) * 100) : 0

  const pieData = analytics ? [
    { name: 'Billable',     value: analytics.billableSeconds,    color: '#10b981' },
    { name: 'Non-billable', value: analytics.nonBillableSeconds, color: '#6366f1' },
  ].filter(d => d.value > 0) : []

  const RANGES: { v: Range; label: string }[] = [
    { v: '7', label: '7d' }, { v: '30', label: '30d' },
    { v: '90', label: '90d' }, { v: '365', label: '1y' },
  ]

  return (
    <>
      {/* Header */}
      <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-white">Analytics</h1>
          <p className="text-xs text-white/40 mt-0.5">
            {user?.role === 'ADMIN' ? 'Workspace overview' : user?.role === 'MANAGER' ? 'Team overview' : 'Your performance'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-xl p-1 gap-0.5">
            {RANGES.map(r => (
              <button key={r.v} onClick={() => setRange(r.v)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  range === r.v ? 'bg-accent text-white' : 'text-white/40 hover:text-white')}
              >{r.label}</button>
            ))}
          </div>
          {tab === 'entries' && (
            <button className="btn-primary" onClick={exportCSV}><Download size={13} />Export CSV</button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="page-container space-y-5">

          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-white/[0.07]">
            {([
              { id: 'overview' as Tab, label: 'Overview', icon: BarChart2 },
              { id: 'entries'  as Tab, label: 'Entries',  icon: List },
            ]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-all',
                  tab === t.id ? 'border-accent text-accent' : 'border-transparent text-white/40 hover:text-white/70'
                )}>
                <t.icon size={13} />{t.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <>
              {/* Stat cards */}
              {analyticsLoading ? (
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="card p-5 h-[76px] animate-pulse" />
                  ))}
                </div>
              ) : analytics && (
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                  <StatCard icon={Clock}     label="Total hours"  value={formatDuration(analytics.totalSeconds)}    sub={`${analytics.entryCount} entries`}                                                                  color="#6366f1" />
                  <StatCard icon={DollarSign} label="Billable"    value={formatDuration(analytics.billableSeconds)} sub={`${billablePct}% of total`}                                                                         color="#10b981" />
                  <StatCard icon={TrendingUp} label="Avg / day"   value={formatDuration(analytics.avgDailySeconds)} sub={analytics.mostActiveDay ? `Best: ${new Date(analytics.mostActiveDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No data yet'} color="#f59e0b" />
                  <StatCard icon={Calendar}   label="Period"      value={range === '365' ? '1 year' : `${range} days`} sub={`${new Date(Date.now() - Number(range)*86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – today`} color="#8b5cf6" />
                </div>
              )}

              {/* Radial chart + donut */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Radial chart */}
                <div className="card p-5 lg:col-span-2">
                  <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-4">
                    Hours tracked {Number(range) <= 7 ? '(daily)' : Number(range) <= 30 ? '(weekly)' : '(monthly)'}
                  </p>
                  {analyticsLoading ? (
                    <div className="h-56 animate-pulse rounded-xl bg-white/[0.03]" />
                  ) : radialChartData.length > 0 ? (
                    <div className="flex items-center gap-3">
                      <ResponsiveContainer width="55%" height={230}>
                        <RadialBarChart
                          cx="50%" cy="50%"
                          innerRadius={16} outerRadius={105}
                          data={radialChartData}
                          startAngle={90} endAngle={-270}
                        >
                          <RadialBar
                            dataKey="value"
                            background={{ fill: 'rgba(255,255,255,0.03)' }}
                            cornerRadius={6}
                          />
                          <Tooltip content={<RadialTooltip />} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-1.5 overflow-y-auto" style={{ maxHeight: 220 }}>
                        {radialChartData.map(d => (
                          <div key={d.name} className="rounded-lg px-2.5 py-2 hover:bg-white/[0.03] transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                              <span className="text-[11px] font-medium flex-1 truncate" style={{ color: d.fill }}>{d.name}</span>
                              <span className="text-[10px] text-white/30">{d.pct}%</span>
                            </div>
                            <p className="text-sm font-mono font-semibold text-white mt-0.5 ml-4">{formatDuration(d.value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-56 flex items-center justify-center text-white/20 text-xs">No data for this period</div>
                  )}
                </div>

                {/* Billable donut */}
                <div className="card p-5 flex flex-col">
                  <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-4">Billable ratio</p>
                  {analyticsLoading ? (
                    <div className="flex-1 animate-pulse rounded-xl bg-white/[0.03]" />
                  ) : analytics && analytics.totalSeconds > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={64} dataKey="value" strokeWidth={0}>
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatDuration(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-2 space-y-2">
                        {pieData.map(d => (
                          <div key={d.name} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                              <span className="text-white/50">{d.name}</span>
                            </span>
                            <span className="font-mono text-white">{formatDuration(d.value)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/[0.06] text-center">
                        <span className="text-3xl font-bold font-mono" style={{ color: '#10b981' }}>{billablePct}%</span>
                        <p className="text-[10px] text-white/30 mt-0.5">billable</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-white/20 text-xs">No data</div>
                  )}
                </div>
              </div>

              {/* Project breakdown */}
              {analytics && analytics.projectBreakdown.length > 0 && (
                <div className="card p-5">
                  <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-4">Project breakdown</p>
                  <div className="space-y-3">
                    {analytics.projectBreakdown.map(p => (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                        <span className="text-sm text-white/80 w-32 truncate flex-shrink-0">{p.name}</span>
                        <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${p.percentage}%`, background: p.color }} />
                        </div>
                        <span className="text-xs font-mono text-white/60 w-14 text-right flex-shrink-0">{formatDuration(p.seconds)}</span>
                        <span className="text-[10px] text-white/25 w-8 text-right flex-shrink-0">{p.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tag chips */}
              {analytics && analytics.tagBreakdown.length > 0 && (
                <div className="card p-5">
                  <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {analytics.tagBreakdown.map(t => (
                      <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs"
                        style={{ borderColor: `${t.color}40`, background: `${t.color}10` }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
                        <span style={{ color: t.color }}>{t.name}</span>
                        <span className="text-white/30 font-mono ml-1">{formatDuration(t.seconds)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team breakdown */}
              {isManager && analytics && analytics.teamBreakdown.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
                    <Users size={13} className="text-white/40" />
                    <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Team overview</p>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {analytics.teamBreakdown.map((member, i) => {
                      const pct     = analytics.totalSeconds > 0 ? Math.round((member.seconds / analytics.totalSeconds) * 100) : 0
                      const billPct = member.seconds > 0          ? Math.round((member.billableSeconds / member.seconds) * 100)    : 0
                      const hue     = (i * 67) % 360
                      return (
                        <div key={member.userId} className="flex items-center gap-4 px-5 py-3.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ background: `hsl(${hue},60%,45%)` }}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-white w-28 truncate flex-shrink-0">{member.name}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: `hsl(${hue},60%,45%)` }} />
                          </div>
                          <span className="text-xs font-mono text-white w-16 text-right flex-shrink-0">{formatDuration(member.seconds)}</span>
                          <span className="text-[10px] text-emerald-400 w-14 text-right flex-shrink-0 hidden sm:block">{billPct}% bill.</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Empty */}
              {!analyticsLoading && analytics && analytics.totalSeconds === 0 && (
                <div className="text-center py-20 text-white/20">
                  <Zap size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No tracked time in this period</p>
                  <p className="text-xs mt-1 text-white/15">Start tracking to see analytics here</p>
                </div>
              )}
            </>
          )}

          {/* ── ENTRIES TAB ── */}
          {tab === 'entries' && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <select className="input py-1.5 text-xs w-full sm:w-44" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
                  <option value="">All projects</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="input py-1.5 text-xs w-full sm:w-44" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
                  <option value="">All tags</option>
                  {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <span className="text-xs text-white/30 ml-auto">
                  {filteredEntries.length} entries · {formatDuration(filteredEntries.reduce((s, e) => s + (e.duration ?? 0), 0))}
                </span>
              </div>

              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.07]">
                        {['Description', 'Project', 'Task', 'Tag', 'Time range', 'Duration'].map(h => (
                          <th key={h} className="text-left text-[11px] font-medium text-white/30 uppercase tracking-wide px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entriesLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="border-b border-white/[0.04]">
                            {Array.from({ length: 6 }).map((_, j) => (
                              <td key={j} className="px-4 py-3">
                                <div className="h-3 bg-white/[0.06] rounded animate-pulse" style={{ width: `${40 + (j * 13) % 50}%` }} />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : filteredEntries.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-14 text-white/30 text-xs">No entries in this period</td></tr>
                      ) : filteredEntries.map(e => (
                        <tr key={e.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 text-white max-w-[160px] truncate">{e.description || <span className="text-white/25 italic">No description</span>}</td>
                          <td className="px-4 py-3">
                            {e.project
                              ? <span className="flex items-center gap-1.5 text-white/60 min-w-0">
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: e.project.color }} />
                                  <span className="truncate">{e.project.name}</span>
                                </span>
                              : <span className="text-white/20">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {e.task
                              ? <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-white/40">
                                  #{e.task.id.slice(0,7)} · {e.task.title.slice(0,20)}
                                </span>
                              : <span className="text-white/20">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {e.tag
                              ? <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">{e.tag.name}</span>
                              : <span className="text-white/20">—</span>}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-white/40">{formatTimeRange(e.startTime, e.endTime)}</td>
                          <td className="px-4 py-3 font-mono text-sm font-semibold text-white">{formatDuration(e.duration ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  )
}
