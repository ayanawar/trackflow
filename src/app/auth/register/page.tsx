'use client'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import api from '@/lib/apiClient'
import { useAuthStore } from '@/lib/authStore'

interface FormData { name: string; email: string; password: string; workspace: string }

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const { register, handleSubmit } = useForm<FormData>()

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/auth/register', data),
    onSuccess: ({ data }) => { setUser(data.user); router.push('/tracker') },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg-primary))] px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
            <Clock size={16} className="text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">TrackFlow</span>
        </div>

        <div className="card p-7">
          <h1 className="text-lg font-semibold text-white mb-1">Create account</h1>
          <p className="text-sm text-white/40 mb-6">Free forever, no credit card</p>

          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-3.5">
            <div>
              <label className="label">Full name</label>
              <input className="input" placeholder="John Doe" {...register('name', { required: true })} />
            </div>
            <div>
              <label className="label">Workspace name</label>
              <input className="input" placeholder="My Company" {...register('workspace', { required: true })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" {...register('email', { required: true })} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Min 8 characters" {...register('password', { required: true, minLength: 8 })} />
            </div>

            {mutation.isError && <p className="text-xs text-accent-red">Registration failed. Please try again.</p>}

            <button type="submit" className="btn-primary w-full justify-center py-2.5 mt-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-xs text-white/40 mt-5">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
