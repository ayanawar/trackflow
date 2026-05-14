'use client'
import { Suspense, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, UserPlus, AlertCircle } from 'lucide-react'
import api from '@/lib/apiClient'
import { useAuthStore } from '@/lib/authStore'
import type { Role } from '@/types'

interface FormData { name: string; password: string; confirm: string }

const roleLabel: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
}

function InviteForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setUser } = useAuthStore()
  const token = searchParams.get('token') ?? ''

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>()
  const password = watch('password', '')

  const { data: invite, isLoading, isError } = useQuery<{ email: string; role: string; workspace: string }>({
    queryKey: ['invite', token],
    queryFn: () => api.get(`/auth/invite?token=${token}`).then(r => r.data),
    enabled: !!token,
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/auth/invite', { token, name: data.name, password: data.password }),
    onSuccess: ({ data }) => {
      setUser(data.user)
      router.push('/tracker')
    },
  })

  if (!token) {
    return (
      <div className="text-center py-4">
        <AlertCircle size={32} className="text-accent-red mx-auto mb-3" />
        <p className="text-sm text-white/50 mb-4">No invite token found.</p>
        <Link href="/auth/login" className="text-accent text-sm hover:underline">Go to sign in</Link>
      </div>
    )
  }

  if (isLoading) {
    return <div className="text-white/40 text-sm text-center py-8">Validating invite…</div>
  }

  if (isError || !invite) {
    return (
      <div className="text-center py-4">
        <AlertCircle size={32} className="text-accent-red mx-auto mb-3" />
        <h1 className="text-base font-semibold text-white mb-2">Invalid or expired invite</h1>
        <p className="text-sm text-white/40 mb-5">This invite link may have expired or already been used.</p>
        <Link href="/auth/login" className="btn-primary w-full justify-center py-2.5">Go to sign in</Link>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-accent/10 border border-accent/20">
        <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <UserPlus size={16} className="text-accent" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{invite.email}</p>
          <p className="text-[11px] text-accent/70">Invited as {roleLabel[invite.role] ?? invite.role} · {invite.workspace}</p>
        </div>
      </div>

      <h1 className="text-lg font-semibold text-white mb-1">Complete your account</h1>
      <p className="text-sm text-white/40 mb-6">Set your name and password to get started.</p>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-3.5">
        <div>
          <label className="label">Full name</label>
          <input className="input" placeholder="John Doe" {...register('name', { required: true })} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" value={invite.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
        </div>
        <div>
          <label className="label">Password</label>
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
            {(mutation.error as any)?.response?.data?.error ?? 'Could not create account. Please try again.'}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary w-full justify-center py-2.5 mt-1"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </>
  )
}

export default function InvitePage() {
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
          <Suspense fallback={<div className="text-white/40 text-sm text-center py-8">Loading…</div>}>
            <InviteForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
