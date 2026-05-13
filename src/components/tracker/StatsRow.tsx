import { Clock, Calendar, Folder, Hash } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import { useAuthStore } from '@/lib/authStore'
import type { Stats } from '@/types'

export default function StatsRow({ stats }: { stats?: Stats }) {
  const { user } = useAuthStore()
  const weekGoal = (user?.dailyHoursGoal ?? 8) * 5 * 3600
  const weekHoursLabel = `${(user?.dailyHoursGoal ?? 8) * 5}h`
  const weekPct = stats ? Math.min(100, Math.round(stats.weekSeconds / weekGoal * 100)) : 0

  return (
    <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-7">
      {[
        { label: 'Today', value: formatDuration(stats?.todaySeconds ?? 0), sub: 'tracked today', icon: Clock, color: '#34d399' },
        { label: 'This Week', value: formatDuration(stats?.weekSeconds ?? 0), sub: `${weekPct}% of ${weekHoursLabel} goal`, icon: Calendar, color: '#4f8ef7' },
        { label: 'Top Project', value: stats?.topProject?.name ?? '—', sub: stats?.topProject ? formatDuration(stats.topProject.totalSeconds) : 'No entries', icon: Folder, color: '#7c6fef', small: true },
        { label: 'Entries', value: String(stats?.totalEntries ?? 0), sub: 'total logged', icon: Hash, color: '#fbbf24' },
      ].map(({ label, value, sub, icon: Icon, color, small }) => (
        <div key={label} className="stat-card">
          <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2.5">
            <Icon size={12} style={{ color }} />{label}
          </div>
          <div className={`font-semibold font-mono text-white leading-tight mb-1 break-words ${small ? 'text-base pt-1' : 'text-xl sm:text-2xl'}`}>{value}</div>
          <div className="text-[11.5px] text-white/40">{sub}</div>
        </div>
      ))}
    </div>
  )
}
