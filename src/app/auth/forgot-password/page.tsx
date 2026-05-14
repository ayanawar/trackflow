'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { Clock, ArrowLeft, Mail } from 'lucide-react'
import api from '@/lib/apiClient'

interface FormData { email: string }

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit } = useForm<FormData>()

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/auth/forgot-password', data),
    onSuccess: () => setSent(true),
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
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-4">
                <Mail size={22} className="text-accent" />
              </div>
              <h1 className="text-lg font-semibold text-white mb-2">Check your inbox</h1>
              <p className="text-sm text-white/40 mb-6">
                If that email exists in our system, a password reset link has been sent.
              </p>
              <Link href="/auth/login" className="btn-primary w-full justify-center py-2.5">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 mb-5 transition-colors">
                <ArrowLeft size={13} />Back to sign in
              </Link>

              <h1 className="text-lg font-semibold text-white mb-1">Forgot password?</h1>
              <p className="text-sm text-white/40 mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...register('email', { required: true })}
                  />
                </div>

                {mutation.isError && (
                  <p className="text-xs text-accent-red">Something went wrong. Please try again.</p>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full justify-center py-2.5"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
