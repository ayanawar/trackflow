'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, Mail, Lock, ArrowRight, Sparkles, BarChart2, Zap } from 'lucide-react'
import api from '@/lib/apiClient'
import { useAuthStore } from '@/lib/authStore'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import AuthPageGuard from '@/components/auth/AuthPageGuard'

interface FormData { email: string; password: string }

const FEATURES = [
  { icon: Clock,    text: 'Real-time time tracking' },
  { icon: BarChart2, text: 'Beautiful reports & insights' },
  { icon: Sparkles, text: 'AI-powered productivity tips' },
  { icon: Zap,      text: 'Team collaboration built-in' },
]

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const { register, handleSubmit } = useForm<FormData>()
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)

  const loginMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/auth/login', data),
    onSuccess: ({ data }) => {
      setUser(data.user)
      router.push('/dashboard')
    },
  })

  const googleMutation = useMutation({
    mutationFn: (idToken: string) => api.post('/auth/google', { idToken }),
    onSuccess: ({ data }) => {
      setUser(data.user)
      router.push('/dashboard')
    },
    onError: (err: any) => setGoogleError(err.response?.data?.error ?? 'Google sign-in failed.'),
  })

  return (
    <AuthPageGuard>
      <div className="min-h-screen flex" style={{ background: 'rgb(var(--bg-primary))' }}>

        {/* ── Left panel (hero) ── */}
        <div className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden p-12"
          style={{ background: 'linear-gradient(135deg, #0a0c1a 0%, #0f1128 50%, #130d2a 100%)' }}>

          {/* Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 animate-pulse-glow"
              style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
            <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full opacity-15 animate-float"
              style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', animationDelay: '1s' }} />
            <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-10 animate-pulse-glow"
              style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', animationDelay: '2s' }} />
            {/* Grid overlay */}
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
              <Sparkles size={11} />Trusted by 1,000+ teams worldwide
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-5" style={{ color: '#fff' }}>
              Track time.<br />
              <span className="gradient-text">Ship faster.</span>
            </h1>
            <p className="text-lg leading-relaxed mb-10 max-w-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              The modern time tracker built for teams that care about productivity and clarity.
            </p>

            {/* Features */}
            <div className="space-y-3.5">
              {FEATURES.map(({ icon: Icon, text }, i) => (
                <div key={text} className="flex items-center gap-3 animate-fade-in"
                  style={{ animationDelay: `${0.2 + i * 0.08}s` }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <Icon size={14} style={{ color: '#818cf8' }} />
                  </div>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom quote */}
          <div className="relative animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.5)' }}>&ldquo;TrackFlow transformed how our team manages time. We ship 40% faster now.&rdquo;</p>
              <div className="flex items-center gap-2.5 mt-3">
                <div className="w-7 h-7 rounded-full animated-gradient flex items-center justify-center text-[11px] font-bold text-white">S</div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Sarah K.</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>CTO, Momentum Labs</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel (form) ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16">

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
              <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
              <p className="text-white/45">Sign in to continue to your workspace</p>
            </div>

            {/* Google */}
            <div className="mb-5">
              <GoogleSignInButton
                onSuccess={(idToken) => { setGoogleError(null); googleMutation.mutate(idToken) }}
                onError={setGoogleError}
                disabled={googleMutation.isPending}
              />
              {googleError && (
                <p className="text-xs text-accent-red mt-2 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-400" />{googleError}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="relative my-6 flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs font-medium px-2" style={{ color: 'rgb(var(--text-faint))' }}>or continue with email</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(d => loginMutation.mutate(d))} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(var(--text-faint))' }} />
                  <input
                    className="input pl-9"
                    type="email"
                    placeholder="you@example.com"
                    {...register('email', { required: true })}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="label !mb-0">Password</label>
                  <Link href="/auth/forgot-password" className="text-xs transition-colors hover:text-accent" style={{ color: 'rgb(var(--text-faint))' }}>
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(var(--text-faint))' }} />
                  <input
                    className="input pl-9 pr-10"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Your password"
                    {...register('password', { required: true })}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors"
                    style={{ color: 'rgb(var(--text-faint))' }}>
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {loginMutation.isError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-red-400"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                  Invalid email or password. Please try again.
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full justify-center py-3 mt-2 group"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm mt-6" style={{ color: 'rgb(var(--text-faint))' }}>
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-semibold text-accent hover:underline underline-offset-2">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthPageGuard>
  )
}
