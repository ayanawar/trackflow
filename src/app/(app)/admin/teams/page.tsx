'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, UserPlus, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

import api from '@/lib/apiClient'
import { useAuthStore } from '@/lib/authStore'
import { cn } from '@/lib/utils'

interface TeamMember { userId: string; memberRole: string; user: { id: string; name: string; email: string } }
interface Team { id: string; name: string; description: string | null; members: TeamMember[]; _count: { members: number } }
interface User { id: string; name: string; email: string; role: string }

const TEAM_COLORS = [
  ['#6366f1', '#8b5cf6'],
  ['#06b6d4', '#6366f1'],
  ['#f59e0b', '#ef4444'],
  ['#10b981', '#06b6d4'],
  ['#ec4899', '#8b5cf6'],
  ['#f97316', '#f59e0b'],
]

function teamColor(id: string) {
  const idx = id.charCodeAt(id.length - 1) % TEAM_COLORS.length
  return TEAM_COLORS[idx]
}

function Avatar({ name, size = 'md', colors }: { name: string; size?: 'sm' | 'md' | 'lg'; colors?: string[] }) {
  const c = colors ?? ['#6366f1', '#8b5cf6']
  const dim = size === 'sm' ? 'w-7 h-7 text-[11px]' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm'
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 shadow-lg', dim)}
      style={{ background: `linear-gradient(135deg, ${c[0]}, ${c[1]})` }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function AdminTeamsPage() {
  const { user, isLoading: authLoading } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()

  useEffect(() => {
    if (!authLoading && user && user.role !== 'ADMIN') router.replace('/dashboard')
  }, [authLoading, user, router])

  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ['admin-teams'],
    queryFn: () => api.get('/admin/teams').then(r => r.data),
    enabled: !authLoading && user?.role === 'ADMIN',
  })

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
    enabled: !authLoading && user?.role === 'ADMIN',
  })

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')

  function toggleExpand(id: string) {
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => api.post('/admin/teams', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-teams'] }); setShowCreate(false); setNewName(''); setNewDesc('') },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; description?: string }) => api.patch(`/admin/teams/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-teams'] }); setEditId(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/teams/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-teams'] }),
  })

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      api.post(`/admin/teams/${teamId}/members`, { userId, memberRole: 'MEMBER' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-teams'] }); setAddingTo(null); setSelectedUserId('') },
  })

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      api.delete(`/admin/teams/${teamId}/members?userId=${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-teams'] }),
  })

  if (authLoading || user?.role !== 'ADMIN') return (
    
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-white/15 border-t-accent animate-spin" />
      </div>
    
  )

  return (
    <>
      {/* Header */}
      <div className="page-header flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <Shield size={13} className="text-white" />
          </div>
          <h1 className="text-[15px] font-semibold text-white">Teams</h1>
          {!isLoading && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border"
              style={{ background: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.25)', color: 'rgb(var(--accent))' }}>
              {teams.length} {teams.length === 1 ? 'team' : 'teams'}
            </span>
          )}
        </div>
        <button onClick={() => { setShowCreate(true); setEditId(null) }} className="btn-primary">
          <Plus size={14} />New team
        </button>
      </div>

      <div className="page-body">
        <div className="page-container max-w-4xl">

          {/* Stats row */}
          {!isLoading && teams.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-in">
              {[
                { label: 'Total teams', value: teams.length, color: '#6366f1' },
                { label: 'Total members', value: teams.reduce((s, t) => s + t._count.members, 0), color: '#8b5cf6' },
                { label: 'Avg team size', value: (teams.reduce((s, t) => s + t._count.members, 0) / teams.length).toFixed(1), color: '#06b6d4' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card p-4 text-center" style={{ borderColor: `${color}22` }}>
                  <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Create form */}
          {showCreate && (
            <div className="card p-5 mb-5 animate-scale-in" style={{ borderColor: 'rgba(99,102,241,0.3)', boxShadow: '0 0 0 1px rgba(99,102,241,0.1), 0 8px 32px rgba(99,102,241,0.1)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg animated-gradient flex items-center justify-center">
                  <Plus size={12} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-white">Create new team</p>
              </div>
              <div className="space-y-3">
                <input
                  autoFocus
                  className="input"
                  placeholder="Team name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && newName.trim() && createMutation.mutate({ name: newName.trim(), description: newDesc.trim() || undefined })}
                />
                <input
                  className="input"
                  placeholder="Description (optional)"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
                <div className="flex gap-2 pt-1">
                  <button
                    className="btn-primary"
                    disabled={!newName.trim() || createMutation.isPending}
                    onClick={() => createMutation.mutate({ name: newName.trim(), description: newDesc.trim() || undefined })}
                  >
                    {createMutation.isPending ? 'Creating…' : 'Create team'}
                  </button>
                  <button className="btn-ghost" onClick={() => { setShowCreate(false); setNewName(''); setNewDesc('') }}>
                    Cancel
                  </button>
                </div>
                {createMutation.isError && <p className="text-xs text-accent-red">Failed to create team. Try again.</p>}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && teams.length === 0 && (
            <div className="card p-12 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl animated-gradient flex items-center justify-center mx-auto mb-4 animate-float">
                <Users size={28} className="text-white" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">No teams yet</h3>
              <p className="text-sm text-white/40 mb-5">Create your first team and start adding members.</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto">
                <Plus size={14} />Create first team
              </button>
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-32 rounded shimmer" />
                      <div className="h-2.5 w-48 rounded shimmer" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Team cards */}
          <div className="space-y-3">
            {teams.map((team, idx) => {
              const isExpanded = expanded.has(team.id)
              const isAddingHere = addingTo === team.id
              const memberIds = new Set(team.members.map(m => m.userId))
              const availableUsers = allUsers.filter(u => !memberIds.has(u.id))
              const [c1, c2] = teamColor(team.id)

              return (
                <div
                  key={team.id}
                  className="card animate-fade-in-up card-glow"
                  style={{ animationDelay: `${idx * 0.05}s`, borderColor: isExpanded ? `${c1}33` : undefined }}
                >
                  {/* Team header */}
                  {editId === team.id ? (
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Pencil size={13} style={{ color: c1 }} />
                        <p className="text-sm font-semibold text-white">Edit team</p>
                      </div>
                      <input
                        autoFocus
                        className="input"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Escape' && setEditId(null)}
                      />
                      <input
                        className="input"
                        placeholder="Description (optional)"
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          className="btn-primary"
                          disabled={!editName.trim() || updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ id: team.id, name: editName.trim(), description: editDesc.trim() || undefined })}
                        >
                          <Check size={13} />{updateMutation.isPending ? 'Saving…' : 'Save changes'}
                        </button>
                        <button className="btn-ghost" onClick={() => setEditId(null)}>
                          <X size={13} />Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: avatar + info + expand trigger */}
                        <button
                          className="flex items-start gap-3.5 text-left flex-1 min-w-0 group"
                          onClick={() => toggleExpand(team.id)}
                        >
                          {/* Team avatar */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0 shadow-lg transition-transform group-hover:scale-105"
                            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                          >
                            {team.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2">
                              <p className="text-[14px] font-semibold text-white truncate">{team.name}</p>
                            </div>
                            {team.description && (
                              <p className="text-xs text-white/45 mt-0.5 truncate">{team.description}</p>
                            )}
                            {/* Member avatars preview */}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex -space-x-1.5">
                                {team.members.slice(0, 5).map(m => (
                                  <div
                                    key={m.userId}
                                    title={m.user.name}
                                    className="w-5 h-5 rounded-full border border-[rgb(var(--bg-card))] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                                    style={{ background: `linear-gradient(135deg,${c1},${c2})` }}
                                  >
                                    {m.user.name.charAt(0).toUpperCase()}
                                  </div>
                                ))}
                                {team._count.members > 5 && (
                                  <div className="w-5 h-5 rounded-full border border-[rgb(var(--bg-card))] bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/60 flex-shrink-0">
                                    +{team._count.members - 5}
                                  </div>
                                )}
                              </div>
                              <span className="text-[11px] text-white/30">
                                {team._count.members === 0 ? 'No members' : `${team._count.members} member${team._count.members !== 1 ? 's' : ''}`}
                              </span>
                              <span className="ml-auto text-white/25 group-hover:text-white/50 transition-colors">
                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => { setEditId(team.id); setEditName(team.name); setEditDesc(team.description ?? '') }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-white/25 hover:text-white hover:bg-white/8"
                            title="Edit team"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Delete "${team.name}"? This cannot be undone.`)) deleteMutation.mutate(team.id) }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-white/25 hover:text-red-400 hover:bg-red-400/10"
                            title="Delete team"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Members panel */}
                  {isExpanded && (
                    <div className="border-t" style={{ borderColor: `${c1}22`, background: `linear-gradient(to bottom, ${c1}08, transparent)` }}>
                      <div className="px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: c1 }}>
                            Members · {team._count.members}
                          </p>
                          {!isAddingHere && availableUsers.length > 0 && (
                            <button
                              onClick={() => { setAddingTo(team.id); setSelectedUserId('') }}
                              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all"
                              style={{ color: c1, background: `${c1}15`, border: `1px solid ${c1}30` }}
                            >
                              <UserPlus size={11} />Add member
                            </button>
                          )}
                        </div>

                        {/* Add member picker */}
                        {isAddingHere && (
                          <div className="flex items-center gap-2 mb-3 animate-scale-in">
                            <select
                              autoFocus
                              className="input flex-1 text-sm py-2"
                              value={selectedUserId}
                              onChange={e => setSelectedUserId(e.target.value)}
                            >
                              <option value="">Select a user…</option>
                              {availableUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                              ))}
                            </select>
                            <button
                              className="btn-primary py-2 px-3"
                              disabled={!selectedUserId || addMemberMutation.isPending}
                              onClick={() => addMemberMutation.mutate({ teamId: team.id, userId: selectedUserId })}
                            >
                              <Check size={13} />{addMemberMutation.isPending ? '…' : 'Add'}
                            </button>
                            <button className="btn-ghost py-2 px-3" onClick={() => { setAddingTo(null); setSelectedUserId('') }}>
                              <X size={13} />
                            </button>
                          </div>
                        )}

                        {/* Member list */}
                        {team.members.length === 0 ? (
                          <div className="text-center py-6">
                            <Users size={20} className="mx-auto mb-2 text-white/15" />
                            <p className="text-xs text-white/30">No members yet. Add someone above.</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {team.members.map((member, mi) => (
                              <div
                                key={member.userId}
                                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl group transition-all hover:bg-white/[0.04]"
                                style={{ animationDelay: `${mi * 0.04}s` }}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-md"
                                    style={{ background: `linear-gradient(135deg,${c1},${c2})` }}
                                  >
                                    {member.user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white leading-tight">{member.user.name}</p>
                                    <p className="text-[11px] text-white/35">{member.user.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide"
                                    style={{ color: c2, borderColor: `${c2}30`, background: `${c2}12` }}>
                                    {member.memberRole}
                                  </span>
                                  <button
                                    onClick={() => removeMemberMutation.mutate({ teamId: team.id, userId: member.userId })}
                                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all text-white/0 group-hover:text-white/30 hover:!text-red-400 hover:bg-red-400/10"
                                    title="Remove member"
                                  >
                                    <X size={11} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {!isAddingHere && availableUsers.length === 0 && team.members.length > 0 && (
                          <p className="text-[11px] text-white/20 mt-3 text-center">All users are already members</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </div>
    
  </>
  )
}
