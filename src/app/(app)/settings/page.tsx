'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Settings, Clock, Target, Sun, Moon, Bell } from 'lucide-react'
import api from '@/lib/apiClient'

import { useAuthStore } from '@/lib/authStore'
import { useThemeStore } from '@/lib/themeStore'
import { cn } from '@/lib/utils'

interface ProfileForm { name: string; workspace: string }
interface GoalForm { dailyHoursGoal: number }

interface ReminderPrefs {
  remindersEnabled: boolean
  reminderTime: number
  notifyManager: boolean
  managerId: string | null
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const { register, handleSubmit } = useForm<ProfileForm>({
    defaultValues: { name: user?.name ?? '', workspace: user?.workspace ?? '' },
  })

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) => api.patch('/auth/me', data),
    onSuccess: ({ data }) => setUser(data),
  })

  const [dailyGoal, setDailyGoal] = useState(user?.dailyHoursGoal ?? 8)
  const weeklyGoal  = dailyGoal * 5
  const monthlyGoal = dailyGoal * 22

  const { handleSubmit: handleGoalSubmit } = useForm<GoalForm>({
    defaultValues: { dailyHoursGoal: user?.dailyHoursGoal ?? 8 },
  })
  const goalMutation = useMutation({
    mutationFn: () => api.patch('/auth/me', { dailyHoursGoal: dailyGoal }),
    onSuccess: ({ data }) => setUser(data),
  })

  const { data: reminderPrefs, isLoading: prefsLoading } = useQuery<ReminderPrefs>({
    queryKey: ['reminder-preferences'],
    queryFn: () => api.get('/user/reminder-preferences').then(r => r.data),
  })
  const [remindersEnabled, setRemindersEnabled] = useState<boolean | null>(null)
  const [reminderTime, setReminderTime] = useState<number | null>(null)
  const [notifyManager, setNotifyManager] = useState<boolean | null>(null)

  const effectiveRemindersEnabled = remindersEnabled ?? reminderPrefs?.remindersEnabled ?? true
  const effectiveReminderTime = reminderTime ?? reminderPrefs?.reminderTime ?? 18
  const effectiveNotifyManager = notifyManager ?? reminderPrefs?.notifyManager ?? true

  const reminderMutation = useMutation({
    mutationFn: () => api.patch('/user/reminder-preferences', {
      remindersEnabled: effectiveRemindersEnabled,
      reminderTime: effectiveReminderTime,
      notifyManager: effectiveNotifyManager,
    }),
  })

  return (<>
    
      <div className="page-header flex items-center gap-3">
        <Settings size={15} className="text-white/40" />
        <h1 className="text-[15px] font-semibold text-white">Settings</h1>
      </div>

      <div className="page-body">
        <div className="page-container">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Profile */}
        <div className="card p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Profile</h2>
          <form onSubmit={handleSubmit(d => profileMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" {...register('name', { required: true })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={user?.email ?? ''} disabled style={{ opacity: 0.4, cursor: 'not-allowed' }} />
              <p className="text-[11px] text-white/30 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="label">Workspace name</label>
              <input className="input" {...register('workspace', { required: true })} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
              {profileMutation.isSuccess && <span className="text-xs text-accent-green">✓ Saved!</span>}
            </div>
          </form>
        </div>

        {/* Work Hours Goal */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-accent" />
            <h2 className="text-sm font-semibold text-white">Work Hours Goal</h2>
          </div>
          <p className="text-xs text-white/40 mb-5">
            Set the expected daily work hours for your workspace. This governs daily, weekly, and monthly targets shown to all members.
          </p>

          <form onSubmit={handleGoalSubmit(() => goalMutation.mutate())} className="space-y-5">
            {/* Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Daily hours goal</label>
                <span className="text-sm font-mono font-semibold text-accent">{dailyGoal}h / day</span>
              </div>
              <input
                type="range" min={1} max={24} step={1}
                value={dailyGoal}
                className="w-full accent-accent h-1.5 rounded-full bg-white/10 cursor-pointer"
                onChange={e => setDailyGoal(Number(e.target.value))}
              />
              <div className="flex justify-between text-[10px] text-white/25 mt-1">
                <span>1h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span>
              </div>
            </div>

            {/* Derived targets */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Daily',   value: `${dailyGoal}h`,   icon: Clock,  color: '#34d399' },
                { label: 'Weekly',  value: `${weeklyGoal}h`,  icon: Target, color: '#4f8ef7' },
                { label: 'Monthly', value: `${monthlyGoal}h`, icon: Target, color: '#7c6fef' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className={cn('rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center')}>
                  <Icon size={13} className="mx-auto mb-1.5" style={{ color }} />
                  <p className="text-xs font-mono font-semibold text-white">{value}</p>
                  <p className="text-[10px] text-white/35 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={goalMutation.isPending}>
                {goalMutation.isPending ? 'Saving…' : 'Save goal'}
              </button>
              {goalMutation.isSuccess && <span className="text-xs text-accent-green">✓ Goal updated!</span>}
            </div>
          </form>
        </div>

        {/* Appearance */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            {theme === 'dark' ? <Moon size={14} className="text-accent" /> : <Sun size={14} className="text-amber-400" />}
            <h2 className="text-sm font-semibold text-white">Appearance</h2>
          </div>
          <p className="text-xs text-white/40 mb-5">Choose between dark and light mode for the interface.</p>
          <div className="grid grid-cols-2 gap-3">
            {(['dark', 'light'] as const).map(t => (
              <button
                key={t}
                onClick={() => theme !== t && toggleTheme()}
                className={cn(
                  'relative flex flex-col items-center gap-3 rounded-xl border p-4 transition-all',
                  theme === t
                    ? 'border-accent/50 bg-accent/8 ring-1 ring-accent/20'
                    : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'
                )}
              >
                <div className={cn(
                  'w-full h-14 rounded-lg flex items-center justify-center gap-2 text-xs font-medium',
                  t === 'dark'
                    ? 'bg-[#0a0c14] text-white/60'
                    : 'bg-[#f0f5ff] text-slate-500'
                )}>
                  <div className={cn('w-2 h-2 rounded-full', t === 'dark' ? 'bg-indigo-400' : 'bg-indigo-500')} />
                  <span>Aa</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {t === 'dark' ? <Moon size={12} className="text-white/50" /> : <Sun size={12} className="text-amber-400" />}
                  <span className="text-xs font-medium text-white capitalize">{t}</span>
                </div>
                {theme === t && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Account info */}
        <div className="card p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Account</h2>
          <div className="space-y-3">
            {[
              { label: 'Plan', value: 'Free' },
              { label: 'Member since', value: new Date().getFullYear().toString() },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-3 py-2 border-b border-white/[0.05]">
                <span className="text-xs text-white/40">{label}</span>
                <span className="text-xs text-white text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Reminders */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={14} className="text-accent" />
            <h2 className="text-sm font-semibold text-white">Smart Reminders</h2>
          </div>
          <p className="text-xs text-white/40 mb-5">
            Get emailed if you forget to log hours by end of day.
          </p>

          {prefsLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-10 rounded-lg bg-white/[0.04]" />
              <div className="h-10 rounded-lg bg-white/[0.04]" />
              <div className="h-10 rounded-lg bg-white/[0.04]" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Enable toggle */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.05]">
                <div>
                  <p className="text-sm text-white">Enable reminders</p>
                  <p className="text-xs text-white/40 mt-0.5">Email me if I have not logged hours by the reminder time</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRemindersEnabled(!effectiveRemindersEnabled)}
                  className={cn(
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                    effectiveRemindersEnabled ? 'bg-accent' : 'bg-white/10'
                  )}
                >
                  <span className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200',
                    effectiveRemindersEnabled ? 'translate-x-5' : 'translate-x-0'
                  )} />
                </button>
              </div>

              {/* Reminder time */}
              <div className={cn('space-y-2', !effectiveRemindersEnabled && 'opacity-40 pointer-events-none')}>
                <label className="label">Reminder time</label>
                <select
                  className="input"
                  value={effectiveReminderTime}
                  onChange={e => setReminderTime(Number(e.target.value))}
                >
                  {[
                    { value: 17, label: '5:00 PM' },
                    { value: 18, label: '6:00 PM' },
                    { value: 19, label: '7:00 PM' },
                  ].map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-white/30">Times are in UTC. Adjust for your timezone.</p>
              </div>

              {/* Notify manager toggle */}
              {reminderPrefs?.managerId && (
                <div className={cn(
                  'flex items-center justify-between gap-4 py-2 border-t border-white/[0.05]',
                  !effectiveRemindersEnabled && 'opacity-40 pointer-events-none'
                )}>
                  <div>
                    <p className="text-sm text-white">Notify my manager</p>
                    <p className="text-xs text-white/40 mt-0.5">Also send a summary to your manager</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifyManager(!effectiveNotifyManager)}
                    className={cn(
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                      effectiveNotifyManager ? 'bg-accent' : 'bg-white/10'
                    )}
                  >
                    <span className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200',
                      effectiveNotifyManager ? 'translate-x-5' : 'translate-x-0'
                    )} />
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center pt-1">
                <button
                  type="button"
                  className="btn-primary w-full sm:w-auto"
                  onClick={() => reminderMutation.mutate()}
                  disabled={reminderMutation.isPending}
                >
                  {reminderMutation.isPending ? 'Saving…' : 'Save preferences'}
                </button>
                {reminderMutation.isSuccess && <span className="text-xs text-accent-green">✓ Saved!</span>}
                {reminderMutation.isError && <span className="text-xs text-accent-red">Failed to save</span>}
              </div>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="card p-4 sm:p-6 border-red-500/20">
          <h2 className="text-sm font-semibold text-accent-red mb-1">Danger Zone</h2>
          <p className="text-xs text-white/40 mb-4">These actions are permanent and cannot be undone.</p>
          <button
            className="min-h-10 w-full text-xs px-3 py-2 border border-red-500/30 text-accent-red rounded-lg hover:border-red-500/60 transition-colors sm:w-auto"
            onClick={() => { if (confirm('Delete all your data? This cannot be undone.')) alert('Contact support to delete your account.') }}
          >
            Delete account & all data
          </button>
        </div>
        </div>
        </div>
      </div>
    
  </>
  )
}
