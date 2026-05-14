'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Users, Plus, X, Pencil, UserPlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/lib/authStore'
import { useOrgMembers } from '@/hooks/useOrgMembers'
import {
  useOrgTeams,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useAddTeamMember,
  useRemoveTeamMember,
  type Team,
} from '@/hooks/useOrgTeams'

export default function TeamsPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const { user } = useAuthStore()

  const { data: teams = [], isLoading } = useOrgTeams(orgId)
  const { data: orgMembers = [] } = useOrgMembers(orgId)
  const createTeam = useCreateTeam(orgId)
  const updateTeam = useUpdateTeam(orgId)
  const deleteTeam = useDeleteTeam(orgId)
  const addMember = useAddTeamMember(orgId)
  const removeMember = useRemoveTeamMember(orgId)

  const myMembership = orgMembers.find(m => m.user.id === user?.id)
  const myRole = myMembership?.role ?? 'EMPLOYEE'
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN' || myRole === 'MANAGER'

  const [showCreate, setShowCreate] = useState(false)
  const [editTeam, setEditTeam] = useState<Team | null>(null)
  const [teamName, setTeamName] = useState('')
  const [teamDesc, setTeamDesc] = useState('')
  const [error, setError] = useState('')

  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')

  function openCreate() {
    setEditTeam(null)
    setTeamName('')
    setTeamDesc('')
    setShowCreate(true)
  }

  function openEdit(team: Team) {
    setEditTeam(team)
    setTeamName(team.name)
    setTeamDesc(team.description ?? '')
    setShowCreate(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!teamName.trim()) return
    setError('')
    try {
      if (editTeam) {
        await updateTeam.mutateAsync({ teamId: editTeam.id, name: teamName.trim(), description: teamDesc.trim() || null })
      } else {
        await createTeam.mutateAsync({ name: teamName.trim(), description: teamDesc.trim() || null })
      }
      setShowCreate(false)
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to save team')
    }
  }

  async function handleAddMember(teamId: string) {
    if (!selectedUserId) return
    try {
      await addMember.mutateAsync({ teamId, userId: selectedUserId })
      setAddingTo(null)
      setSelectedUserId('')
    } catch {}
  }

  const isSaving = createTeam.isPending || updateTeam.isPending
  const initials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <AppShell>
      <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/organizations" className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 mb-1.5 transition-colors">
            <ArrowLeft size={12} /> Organizations
          </Link>
          <h1 className="text-[15px] font-semibold text-white">Teams</h1>
          <p className="text-[12px] text-white/40 mt-0.5">{teams.length} team{teams.length !== 1 ? 's' : ''}</p>
        </div>
        {canManage && (
          <button className="btn-primary w-full sm:w-auto" onClick={openCreate}>
            <Plus size={14} /> New Team
          </button>
        )}
      </div>

      <div className="page-body">
        <div className="page-container">
          {isLoading ? (
            <div className="text-center py-20 text-white/30 text-sm">Loading…</div>
          ) : teams.length === 0 ? (
            <div className="text-center py-20 text-white/30">
              <Users size={40} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">{canManage ? 'No teams yet. Create your first!' : 'No teams in this organization.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {teams.map(team => {
                const isAddingHere = addingTo === team.id
                const eligibleToAdd = orgMembers.filter(m => !team.members.some(tm => tm.userId === m.user.id))
                return (
                  <div key={team.id} className="card p-5 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{team.name}</h3>
                        {team.description && <p className="text-[11px] text-white/40 mt-0.5 truncate">{team.description}</p>}
                        <p className="text-[11px] text-white/30 mt-1">{team._count.members} member{team._count.members !== 1 ? 's' : ''}</p>
                      </div>
                      {canManage && (
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          <button className="text-white/30 hover:text-white transition-colors p-0.5" onClick={() => openEdit(team)}>
                            <Pencil size={12} />
                          </button>
                          <button
                            className="text-white/30 hover:text-accent-red transition-colors p-0.5"
                            onClick={() => { if (confirm('Delete this team?')) deleteTeam.mutate(team.id) }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {team.members.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {team.members.map(tm => (
                          <div key={tm.userId} className="flex items-center gap-1.5 bg-white/5 rounded-full pl-1 pr-2 py-0.5 group/member">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-accent-purple flex items-center justify-center text-[9px] font-semibold text-white flex-shrink-0">
                              {initials(tm.user.name)}
                            </div>
                            <span className="text-[11px] text-white/60">{tm.user.name.split(' ')[0]}</span>
                            {canManage && (
                              <button
                                onClick={() => removeMember.mutate({ teamId: team.id, userId: tm.userId })}
                                className="hidden group-hover/member:flex text-white/30 hover:text-accent-red transition-colors"
                              >
                                <X size={10} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {canManage && (
                      isAddingHere ? (
                        <div className="flex gap-2">
                          <select
                            className="flex-1 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-[12px] text-white focus:outline-none focus:border-accent/50"
                            value={selectedUserId}
                            onChange={e => setSelectedUserId(e.target.value)}
                          >
                            <option value="">Select member…</option>
                            {eligibleToAdd.map(m => (
                              <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAddMember(team.id)}
                            disabled={!selectedUserId || addMember.isPending}
                            className="rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setAddingTo(null); setSelectedUserId('') }}
                            className="rounded-lg border border-white/10 px-2 py-1.5 text-[12px] text-white/50"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddingTo(team.id); setSelectedUserId('') }}
                          className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 transition-colors"
                        >
                          <UserPlus size={12} /> Add member
                        </button>
                      )
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
          onClick={e => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className="w-full max-w-[400px] rounded-2xl border border-white/10 bg-[rgb(var(--bg-secondary))] p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-white mb-5">{editTeam ? 'Edit Team' : 'New Team'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Team name</label>
                <input
                  className="input"
                  placeholder="e.g. Engineering"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <input
                  className="input"
                  placeholder="What does this team work on?"
                  value={teamDesc}
                  onChange={e => setTeamDesc(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="btn-ghost" onClick={() => { setShowCreate(false); setError('') }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSaving || !teamName.trim()}>
                  {isSaving ? 'Saving…' : editTeam ? 'Save Changes' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
