'use client'
import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, ArrowLeft, CheckCircle } from 'lucide-react'
import api from '@/lib/apiClient'

interface FormData { password: string; confirm: string }

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''
  const [done, setDone] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>()
  const password = watch('password', '')

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/auth/reset-password', { token, password: data.password }),
    onSuccess: () => setDone(true),
  })

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-accent-red mb-4">Invalid or missing reset token.</p>
        <Link href="/auth/forgot-password" className="btn-primary w-full justify-center py-2.5">Request a new link</Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={22} className="text-emerald-400" />
        </div>
        <h1 className="text-lg font-semibold text-white mb-2">Password updated</h1>
        <p className="text-sm text-white/40 mb-6">You can now sign in with your new password.</p>
        <button className="btn-primary w-full justify-center py-2.5" onClick={() => router.push('/auth/login')}>
          Sign in
        </button>
      </div>
    )
  }

  return (
    <>
      <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 mb-5 transition-colors">
        <ArrowLeft size={13} />Back to sign in
      </Link>

      <h1 className="text-lg font-semibold text-white mb-1">Set new password</h1>
      <p className="text-sm text-white/40 mb-6">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="label">New password</label>
          <input
            className="input"
            type="password"
            placeholder="Min 8 characters"
            autoComplete="new-password"
            {...register('password', { required: true, minLength: 8 })}
          />
          {errors.password && <p className="text-xs text-accent-red mt-1">At least 8 characters required</p>}
        </div>

        <div>
          <label className="label">Confirm password</label>
          <input
            className="input"
            type="password"
            placeholder="Repeat password"
            autoComplete="new-password"
            {...register('confirm', {
              required: true,
              validate: v => v === password || 'Passwords do not match',
            })}
          />
          {errors.confirm && <p className="text-xs text-accent-red mt-1">{errors.confirm.message}</p>}
        </div>

        {mutation.isError && (
          <p className="text-xs text-accent-red">
            {(mutation.error as any)?.response?.data?.error ?? 'Invalid or expired reset link. Please request a new one.'}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary w-full justify-center py-2.5"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
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
          <Suspense fallback={<div className="text-white/40 text-sm text-center py-4">Loading…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
