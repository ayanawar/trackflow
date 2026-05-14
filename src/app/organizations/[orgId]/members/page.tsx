'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Users, UserMinus, ChevronDown, Mail, X, Crown, Shield, Briefcase, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/lib/authStore'
import {
  useOrgMembers,
  useOrgInvitations,
  useInviteMember,
  useCancelInvitation,
  useUpdateMemberRole,
  useRemoveMember,
} from '@/hooks/useOrgMembers'
import Select from '@/components/ui/Select'

const ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE'] as const
type Role = (typeof ROLES)[number]

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'text-yellow-400 bg-yellow-400/10',
  ADMIN: 'text-blue-400 bg-blue-400/10',
  MANAGER: 'text-green-400 bg-green-400/10',
  EMPLOYEE: 'text-white/40 bg-white/5',
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  OWNER: <Crown size={11} />,
  ADMIN: <Shield size={11} />,
  MANAGER: <Briefcase size={11} />,
  EMPLOYEE: <User size={11} />,
}

export default function MembersPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const { user } = useAuthStore()

  const { data: members = [], isLoading: membersLoading } = useOrgMembers(orgId)
  const { data: invitations = [], isLoading: invitesLoading } = useOrgInvitations(orgId)
  const inviteMember = useInviteMember(orgId)
  const cancelInvitation = useCancelInvitation(orgId)
  const updateRole = useUpdateMemberRole(orgId)
  const removeMember = useRemoveMember(orgId)

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('EMPLOYEE')
  const [inviteError, setInviteError] = useState('')

  const myMembership = members.find(m => m.user.id === user?.id)
  const myRole = myMembership?.role ?? 'EMPLOYEE'
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN'

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviteError('')
    try {
      await inviteMember.mutateAsync({ email: inviteEmail.trim(), role: inviteRole })
      setInviteEmail('')
      setShowInvite(false)
    } catch (err: any) {
      setInviteError(err?.response?.data?.error ?? 'Failed to send invitation')
    }
  }

  const initials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <AppShell>
      <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/organizations" className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 mb-1.5 transition-colors">
            <ArrowLeft size={12} /> Organizations
          </Link>
          <h1 className="text-[15px] font-semibold text-white">Members</h1>
          <p className="text-[12px] text-white/40 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        {canManage && (
          <button className="btn-primary w-full sm:w-auto" onClick={() => setShowInvite(true)}>
            <Mail size={14} /> Invite Member
          </button>
        )}
      </div>

      <div className="page-body">
        <div className="page-container space-y-6">
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <h2 className="text-[13px] font-medium text-white/70 flex items-center gap-2">
                <Users size={13} /> Members
              </h2>
            </div>
            {membersLoading ? (
              <div className="px-5 py-8 text-center text-white/30 text-sm">Loading…</div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-purple flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
                      {initials(m.user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white truncate">{m.user.name}</p>
                      <p className="text-[11px] text-white/40 truncate">{m.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManage && m.role !== 'OWNER' && m.user.id !== user?.id ? (
                        <div className="relative group/role">
                          <button className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full font-medium ${ROLE_COLORS[m.role]}`}>
                            {ROLE_ICONS[m.role]} {m.role} <ChevronDown size={10} />
                          </button>
                          <div className="absolute right-0 top-full mt-1 hidden group-hover/role:block z-10 w-32 rounded-xl border border-white/[0.08] bg-[rgb(var(--bg-secondary))] shadow-xl py-1">
                            {ROLES.map(r => (
                              <button
                                key={r}
                                onClick={() => updateRole.mutate({ userId: m.user.id, role: r })}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                              >
                                {ROLE_ICONS[r]} {r}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full font-medium ${ROLE_COLORS[m.role]}`}>
                          {ROLE_ICONS[m.role]} {m.role}
                        </span>
                      )}
                      {canManage && m.role !== 'OWNER' && m.user.id !== user?.id && (
                        <button
                          onClick={() => { if (confirm('Remove this member?')) removeMember.mutate(m.user.id) }}
                          className="text-white/20 hover:text-accent-red transition-colors p-1"
                          title="Remove member"
                        >
                          <UserMinus size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {canManage && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06]">
                <h2 className="text-[13px] font-medium text-white/70 flex items-center gap-2">
                  <Mail size={13} /> Pending Invitations
                </h2>
              </div>
              {invitesLoading ? (
                <div className="px-5 py-8 text-center text-white/30 text-sm">Loading…</div>
              ) : invitations.length === 0 ? (
                <div className="px-5 py-8 text-center text-white/20 text-sm">No pending invitations</div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {invitations.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <Mail size={13} className="text-white/30" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-white truncate">{inv.email}</p>
                        <p className="text-[11px] text-white/30">Expires {new Date(inv.expiresAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${ROLE_COLORS[inv.role]}`}>
                        {inv.role}
                      </span>
                      <button
                        onClick={() => cancelInvitation.mutate(inv.id)}
                        className="text-white/20 hover:text-accent-red transition-colors p-1"
                        title="Cancel invitation"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showInvite && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
          onClick={e => e.target === e.currentTarget && setShowInvite(false)}
        >
          <div className="w-full max-w-[400px] rounded-2xl border border-white/10 bg-[rgb(var(--bg-secondary))] p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-white mb-5">Invite Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Role</label>
                <Select
                  value={inviteRole}
                  onChange={setInviteRole}
                  options={ROLES.map(r => ({ value: r, label: r }))}
                />
              </div>
              {inviteError && <p className="text-sm text-red-400">{inviteError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="btn-ghost" onClick={() => { setShowInvite(false); setInviteError('') }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={inviteMember.isPending || !inviteEmail.trim()}>
                  {inviteMember.isPending ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
