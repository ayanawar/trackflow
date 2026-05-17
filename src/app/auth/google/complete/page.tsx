'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Building2, ArrowRight, Clock } from 'lucide-react'
import api from '@/lib/apiClient'
import { useAuthStore } from '@/lib/authStore'

interface GoogleSetupData {
  setupToken: string
  hints?: { suggestedWorkspaceName?: string }
}

interface FormData {
  organizationName: string
  workspaceName: string
}

export default function GoogleCompletePage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [setup, setSetup] = useState<GoogleSetupData | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const { register, handleSubmit, setValue } = useForm<FormData>()

  useEffect(() => {
    const raw = sessionStorage.getItem('tf_google_setup')
    if (!raw) {
      router.replace('/auth/login')
      return
    }
    try {
      const parsed = JSON.parse(raw) as GoogleSetupData
      setSetup(parsed)
      if (parsed.hints?.suggestedWorkspaceName) {
        setValue('workspaceName', parsed.hints.suggestedWorkspaceName)
      }
    } catch {
      sessionStorage.removeItem('tf_google_setup')
      router.replace('/auth/login')
      return
    }
    setHydrated(true)
  }, [router, setValue])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/auth/google/complete', { ...data, setupToken: setup?.setupToken }),
    onSuccess: ({ data }) => {
      sessionStorage.removeItem('tf_google_setup')
      setUser(data.user)
      router.push('/dashboard')
    },
  })

  if (!hydrated) return null

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: 'rgb(var(--bg-primary))' }}>
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl animated-gradient flex items-center justify-center shadow-lg">
            <Clock size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight gradient-text">TrackFlow</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Finish setting up your account</h2>
        <p className="text-sm mb-6" style={{ color: 'rgb(var(--text-muted))' }}>
          We just need a name for your organization and your first workspace.
        </p>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <label className="label">Organization name</label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(var(--text-faint))' }} />
              <input
                className="input pl-9"
                placeholder="Acme Inc."
                maxLength={60}
                {...register('organizationName', { required: true, maxLength: 60 })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="label">Workspace name</label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(var(--text-faint))' }} />
              <input
                className="input pl-9"
                placeholder="Engineering"
                maxLength={60}
                {...register('workspaceName', { required: true, maxLength: 60 })}
              />
            </div>
          </div>

          {mutation.isError && (
            <div className="text-xs text-red-400 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
              {(mutation.error as any)?.response?.data?.error ?? 'Could not finish setup. Please try signing in with Google again.'}
            </div>
          )}

          <button type="submit" className="btn-primary w-full justify-center py-3" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Creating workspace…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Continue
                <ArrowRight size={15} />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
