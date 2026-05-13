'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import AppShell from '@/components/layout/AppShell'
import { formatDuration } from '@/lib/utils'
import { useStats } from '@/hooks/useStats'
import { useProjects } from '@/hooks/useProjects'

export default function DashboardPage() {
  const { data: stats } = useStats()
  const { data: projects = [] } = useProjects()

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date().getDay()

  const chartData = (stats?.dailyTotals ?? []).map(d => ({
    day: days[new Date(d.date + 'T00:00:00').getDay()],
    hours: +(d.seconds / 3600).toFixed(1),
    isToday: new Date(d.date + 'T00:00:00').getDay() === today,
  }))

  const maxSecs = projects.reduce((m, p) => Math.max(m, p.totalSeconds ?? 0), 1)

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="text-[15px] font-semibold text-white">Dashboard</h1>
        <p className="text-xs text-white/40 mt-0.5">Weekly overview</p>
      </div>

      <div className="p-7 flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: 'Today', value: formatDuration(stats?.todaySeconds ?? 0) },
            { label: 'This Week', value: formatDuration(stats?.weekSeconds ?? 0) },
            { label: 'This Month', value: formatDuration(stats?.monthSeconds ?? 0) },
          ].map(({ label, value }) => (
            <div key={label} className="stat-card">
              <div className="text-xs text-white/40 mb-2">{label}</div>
              <div className="text-xl sm:text-2xl font-mono font-semibold text-white break-words">{value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_260px] gap-5">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-white mb-5">Hours per Day (Last 7 Days)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={24}>
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
                <Tooltip
                  contentStyle={{ background: 'rgb(22,27,39)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e8eaf2', fontSize: 12 }}
                  formatter={(v: number) => [`${v}h`, 'Hours']}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.isToday ? '#34d399' : '#4f8ef7'} opacity={entry.isToday ? 1 : 0.55} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Projects</h2>
            {projects.length === 0
              ? <p className="text-xs text-white/30">No projects yet</p>
              : (
                <div className="space-y-3">
                  {projects.sort((a, b) => (b.totalSeconds ?? 0) - (a.totalSeconds ?? 0)).map(p => (
                    <div key={p.id}>
                      <div className="flex justify-between items-center gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                          <span className="text-xs text-white truncate">{p.name}</span>
                        </div>
                        <span className="text-xs font-mono text-white/50 whitespace-nowrap">{formatDuration(p.totalSeconds ?? 0)}</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/5">
                        <div
                          className="h-1 rounded-full transition-all duration-700"
                          style={{ width: `${Math.round((p.totalSeconds ?? 0) / maxSecs * 100)}%`, background: p.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mt-5">
          {(stats?.dailyTotals ?? []).map((d) => {
            const isToday = new Date(d.date + 'T00:00:00').getDay() === today
            const maxDay = Math.max(...(stats?.dailyTotals ?? []).map(x => x.seconds), 3600)
            return (
              <div key={d.date} className={`card p-3 ${isToday ? 'border-accent/30' : ''}`}>
                <div className="text-[10px] text-white/40 mb-1">{days[new Date(d.date + 'T00:00:00').getDay()]}</div>
                <div className="text-sm font-mono font-semibold text-white break-words">{formatDuration(d.seconds)}</div>
                <div className="h-1 rounded-full bg-white/5 mt-2">
                  <div className="h-1 rounded-full" style={{ width: `${Math.round(d.seconds / maxDay * 100)}%`, background: isToday ? '#34d399' : '#4f8ef7' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
