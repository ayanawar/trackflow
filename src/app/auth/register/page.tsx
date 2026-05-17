'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, Mail, Lock, User, Building2, ArrowRight, Check } from 'lucide-react'
import api from '@/lib/apiClient'
import { useAuthStore } from '@/lib/authStore'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import AuthPageGuard from '@/components/auth/AuthPageGuard'
import ClockLoginAnimation from '@/components/auth/ClockLoginAnimation'

interface FormData {
  organizationName: string
  workspaceName: string
  name: string
  email: string
  password: string
}

const PERKS = [
  'No credit card required',
  'Free forever on solo plan',
  'Set up in under 2 minutes',
]

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const { register, handleSubmit, watch } = useForm<FormData>()
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)

  const password = watch('password', '')
  const strength = !password ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[^a-zA-Z0-9]/.test(password) ? 4 : 3
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColor = ['', '#f87171', '#fbbf24', '#34d399', '#6366f1']

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/auth/register', data),
    onSuccess: ({ data }) => {
      setUser(data.user)
      router.push('/dashboard')
    },
  })

  const googleMutation = useMutation({
    mutationFn: (idToken: string) => api.post('/auth/google', { idToken }),
    onSuccess: ({ data }) => {
      if (data?.status === 'NEEDS_SETUP') {
        sessionStorage.setItem('tf_google_setup', JSON.stringify(data))
        router.push('/auth/google/complete')
        return
      }
      setUser(data.user)
      router.push('/dashboard')
    },
    onError: (err: any) => setGoogleError(err.response?.data?.error ?? 'Google sign-in failed.'),
  })

  return (
    <AuthPageGuard>
      <div className="min-h-screen flex" style={{ background: 'rgb(var(--bg-primary))' }}>

        {/* ── Left panel (hero) ── */}
        <div className="hidden lg:flex flex-col justify-between w-[48%] relative overflow-hidden p-12"
          style={{ background: 'linear-gradient(135deg, #0a0c1a 0%, #0f1128 50%, #130d2a 100%)' }}>

          {/* Background orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20 animate-pulse-glow"
              style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
            <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full opacity-15 animate-float"
              style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', animationDelay: '1.5s' }} />
            <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full opacity-10 animate-pulse-glow"
              style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', animationDelay: '0.8s' }} />
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
          </div>

          {/* Logo */}
          <div className="relative flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-2xl animated-gradient flex items-center justify-center shadow-lg animate-float">
              <Clock size={18} className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight gradient-text">TrackFlow</span>
          </div>

          {/* Hero copy */}
          <div className="relative animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-5xl font-bold leading-tight mb-5" style={{ color: '#fff' }}>
              Start tracking.<br />
              <span className="gradient-text">Stay ahead.</span>
            </h1>
            <p className="text-lg leading-relaxed mb-10 max-w-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Join thousands of teams who use TrackFlow to stay organized and ship their best work.
            </p>

            <ClockLoginAnimation />

            {/* Perks */}
            <div className="space-y-4 mb-10 mt-10">
              {PERKS.map((perk, i) => (
                <div key={perk} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${0.2 + i * 0.08}s` }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)' }}>
                    <Check size={11} style={{ color: '#818cf8' }} />
                  </div>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{perk}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '10K+', label: 'Teams' },
                { value: '99.9%', label: 'Uptime' },
                { value: '4.9★', label: 'Rating' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center p-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-xl font-bold gradient-text">{value}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>© 2026 TrackFlow. All rights reserved.</p>
          </div>
        </div>

        {/* ── Right panel (form) ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16 overflow-y-auto">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-10 animate-fade-in">
            <div className="w-9 h-9 rounded-xl animated-gradient flex items-center justify-center shadow-lg">
              <Clock size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight gradient-text">TrackFlow</span>
          </div>

          <div className="w-full max-w-sm animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Create account</h2>
              <p className="text-white/45">Get started — it&apos;s completely free</p>
            </div>

            {/* Google */}
            <div className="mb-5">
              <GoogleSignInButton
                onSuccess={(idToken) => { setGoogleError(null); googleMutation.mutate(idToken) }}
                onError={setGoogleError}
                disabled={googleMutation.isPending}
              />
              {googleError && (
                <p className="text-xs text-accent-red mt-2">{googleError}</p>
              )}
            </div>

            {/* Divider */}
            <div className="relative my-6 flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs font-medium px-2" style={{ color: 'rgb(var(--text-faint))' }}>or sign up with email</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              {/* Organization (BEFORE Workspace per FR-001) */}
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

              {/* Workspace (AFTER Organization) */}
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

              {/* Name */}
              <div className="space-y-1.5">
                <label className="label">Full name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(var(--text-faint))' }} />
                  <input className="input pl-9" placeholder="John Doe" {...register('name', { required: true })} />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(var(--text-faint))' }} />
                  <input className="input pl-9" type="email" placeholder="you@example.com" {...register('email', { required: true })} />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(var(--text-faint))' }} />
                  <input
                    className="input pl-9 pr-10"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    {...register('password', { required: true, minLength: 8 })}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors"
                    style={{ color: 'rgb(var(--text-faint))' }}>
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
                {/* Password strength bar */}
                {password.length > 0 && (
                  <div className="space-y-1 animate-fade-in">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength ? strengthColor[strength] : 'rgba(255,255,255,0.08)' }} />
                      ))}
                    </div>
                    <p className="text-[11px] font-medium" style={{ color: strengthColor[strength] }}>
                      {strengthLabel[strength]} password
                    </p>
                  </div>
                )}
              </div>

              {mutation.isError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-red-400"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                  Registration failed. Please check your details and try again.
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full justify-center py-3 mt-2 group"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create free account
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </button>

              <p className="text-[11px] text-center" style={{ color: 'rgb(var(--text-faint))' }}>
                By signing up you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>

            {/* Footer */}
            <p className="text-center text-sm mt-6" style={{ color: 'rgb(var(--text-faint))' }}>
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-accent hover:underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthPageGuard>
  )
}
