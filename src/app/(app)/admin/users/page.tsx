'use client'
import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, ShieldCheck, UserPlus, Copy, X, Check, ExternalLink } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { useAuthStore } from '@/lib/authStore'
import api from '@/lib/apiClient'
import { useRouter } from 'next/navigation'
import type { Role } from '@/types'

interface UserRow {
  id: string
  name: string
  email: string
  workspace: string
  role: Role
  createdAt: string
}

interface InviteForm { email: string; role: Role }

const ROLES: Role[] = ['ADMIN', 'MANAGER', 'EMPLOYEE']

const roleLabel: Record<Role, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
}

const roleBadge: Record<Role, string> = {
  ADMIN: 'bg-accent/20 text-accent border border-accent/30',
  MANAGER: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  EMPLOYEE: 'bg-white/10 text-white/50 border border-white/10',
}

export default function AdminUsersPage() {
  const { user: me, isLoading: authLoading } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [savingId, setSavingId] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!authLoading && me && me.role !== 'ADMIN') router.replace('/dashboard')
  }, [authLoading, me, router])

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
    enabled: !authLoading && me?.role === 'ADMIN',
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      api.patch(`/admin/users/${id}`, { role }).then(r => r.data),
    onMutate: ({ id }) => setSavingId(id),
    onSettled: () => setSavingId(null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteForm>({
    defaultValues: { role: 'EMPLOYEE' },
  })

  const inviteMutation = useMutation({
    mutationFn: (data: InviteForm) => api.post('/admin/invites', data).then(r => r.data),
    onSuccess: (data) => {
      setInviteLink(data.inviteUrl)
      reset()
    },
  })

  const copyLink = () => {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const closeModal = () => {
    setShowInviteModal(false)
    setInviteLink(null)
    reset()
    inviteMutation.reset()
  }

  if (authLoading || me?.role !== 'ADMIN') return (<>
    
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="h-10 w-10 rounded-full border-2 border-white/15 border-t-accent animate-spin" aria-label="Loading admin session" />
      </div>
    
  )

  return (
    
      <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={15} className="text-white/40" />
          <h1 className="text-[15px] font-semibold text-white">User Management</h1>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={() => setShowInviteModal(true)}>
          <UserPlus size={14} />Invite User
        </button>
      </div>

      <div className="page-body">
        <div className="page-container">
          {isLoading ? (
            <div className="text-center py-20 text-white/30 text-sm">Loading users…</div>
          ) : (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.07] flex items-center gap-2">
                <Users size={14} className="text-white/40" />
                <span className="text-sm font-medium text-white">{users.length} member{users.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {users.map(u => (
                  <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-purple flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
                      {u.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{u.name}</p>
                        {u.id === me?.id && (
                          <span className="text-[10px] text-white/30 border border-white/10 rounded px-1.5 py-0.5 flex-shrink-0">you</span>
                        )}
                      </div>
                      <p className="text-[12px] text-white/40 truncate mt-0.5">{u.email}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`hidden sm:inline-flex items-center text-[11px] font-medium rounded-full px-2.5 py-1 flex-shrink-0 ${roleBadge[u.role]}`}>
                        {roleLabel[u.role]}
                      </span>

                      <select
                        value={u.role}
                        disabled={savingId === u.id || u.id === me?.id}
                        onChange={e => roleMutation.mutate({ id: u.id, role: e.target.value as Role })}
                        className="text-[12px] bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white/70 focus:outline-none focus:border-accent/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:border-white/20"
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r} className="bg-[#1a1a2e] text-white">
                            {roleLabel[r]}
                          </option>
                        ))}
                      </select>

                      {savingId === u.id && (
                        <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center">
                  <UserPlus size={15} className="text-accent" />
                </div>
                <h2 className="text-base font-semibold text-white">Invite User</h2>
              </div>
              <button onClick={closeModal} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>

            {inviteLink ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Check size={15} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-sm text-emerald-300">Invite created successfully!</p>
                </div>

                <div>
                  <label className="label">Share this invite link</label>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1 text-xs font-mono"
                      value={inviteLink}
                      readOnly
                      onFocus={e => e.target.select()}
                    />
                    <button
                      onClick={copyLink}
                      className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-colors"
                      title="Copy link"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-white/30 mt-2">Link expires in 7 days. Share it with the user to let them register.</p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button className="btn-secondary flex-1 justify-center" onClick={() => { setInviteLink(null); inviteMutation.reset() }}>
                    Invite another
                  </button>
                  <button className="btn-primary flex-1 justify-center" onClick={closeModal}>Done</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(d => inviteMutation.mutate(d))} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="colleague@company.com"
                    {...register('email', { required: true })}
                  />
                </div>

                <div>
                  <label className="label">Role</label>
                  <select
                    className="input"
                    {...register('role', { required: true })}
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r} className="bg-[#1a1a2e]">{roleLabel[r]}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-white/30 mt-1.5">
                    Admin — full access · Manager — reports &amp; insights · Employee — time tracking only
                  </p>
                </div>

                {inviteMutation.isError && (
                  <p className="text-xs text-accent-red">
                    {(inviteMutation.error as any)?.response?.data?.error ?? 'Could not create invite. Please try again.'}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="button" className="btn-secondary flex-1 justify-center" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn-primary flex-1 justify-center" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? 'Creating…' : 'Create invite'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    
  </>
  )
}
