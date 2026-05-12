'use client'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Settings } from 'lucide-react'
import api from '@/lib/apiClient'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/lib/authStore'

interface ProfileForm { name: string; workspace: string }

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const { register, handleSubmit } = useForm<ProfileForm>({
    defaultValues: { name: user?.name ?? '', workspace: user?.workspace ?? '' },
  })

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) => api.patch('/auth/me', data),
    onSuccess: ({ data }) => setUser(data),
  })

  return (
    <AppShell>
      <div className="border-b border-white/[0.07] px-7 py-4 flex items-center gap-3 bg-[rgb(var(--bg-secondary))]">
        <Settings size={15} className="text-white/40" />
        <h1 className="text-[15px] font-semibold text-white">Settings</h1>
      </div>

      <div className="p-7 max-w-lg flex-1 overflow-y-auto space-y-6">
        {/* Profile */}
        <div className="card p-6">
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
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
              {profileMutation.isSuccess && <span className="text-xs text-accent-green">✓ Saved!</span>}
            </div>
          </form>
        </div>

        {/* Account info */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Account</h2>
          <div className="space-y-3">
            {[
              { label: 'Plan', value: 'Free' },
              { label: 'Member since', value: new Date().getFullYear().toString() },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-white/[0.05]">
                <span className="text-xs text-white/40">{label}</span>
                <span className="text-xs text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="card p-6 border-red-500/20">
          <h2 className="text-sm font-semibold text-accent-red mb-1">Danger Zone</h2>
          <p className="text-xs text-white/40 mb-4">These actions are permanent and cannot be undone.</p>
          <button
            className="text-xs px-3 py-2 border border-red-500/30 text-accent-red rounded-lg hover:border-red-500/60 transition-colors"
            onClick={() => { if (confirm('Delete all your data? This cannot be undone.')) alert('Contact support to delete your account.') }}
          >
            Delete account & all data
          </button>
        </div>
      </div>
    </AppShell>
  )
}
