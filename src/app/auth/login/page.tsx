'use client'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import api from '@/lib/apiClient'
import { useAuthStore } from '@/lib/authStore'

interface FormData { email: string; password: string }

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const { register, handleSubmit } = useForm<FormData>()

  const loginMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/auth/login', data),
    onSuccess: ({ data }) => {
      setUser(data.user)
      router.push('/tracker')
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg-primary))] px-4 py-8">
      <div className="w-full max-w-[min(24rem,calc(100vw-2rem))]">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
            <Clock size={16} className="text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">TrackFlow</span>
        </div>

        <div className="card p-5 sm:p-7">
          <h1 className="text-lg font-semibold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-white/40 mb-6">Sign in to your workspace</p>

          <form onSubmit={handleSubmit(d => loginMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" {...register('email', { required: true })} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Password" {...register('password', { required: true })} />
            </div>

            {loginMutation.isError && (
              <p className="text-xs text-accent-red">Invalid credentials. Please try again.</p>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs text-white/40 mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-accent hover:underline">Sign up free</Link>
          </p>

        </div>
      </div>
    </div>
  )
}
