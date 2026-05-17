'use client'
import { useState } from 'react'
import { Plus, X, Pencil, LayoutGrid, Search, UserPlus, Check } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { formatDuration } from '@/lib/utils'
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects'
import { useAuthStore } from '@/lib/authStore'
import api from '@/lib/apiClient'
import type { Project, ProjectStatus, ProjectAssignmentUser } from '@/types'

const COLORS = ['#4f8ef7', '#7c6fef', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#6ee7b7']

const STATUS_META: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: 'Active',    color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  ON_HOLD:   { label: 'On Hold',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  COMPLETED: { label: 'Completed', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  ARCHIVED:  { label: 'Archived',  color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
}

interface FormData { name: string; client: string }

export default function ProjectsPage() {
  const [modal, setModal] = useState(false)
  const [search, setSearch] = useState('')
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>('ACTIVE')
  const [localAssignments, setLocalAssignments] = useState<ProjectAssignmentUser[]>([])
  const [addUserId, setAddUserId] = useState('')
  const [assignPending, setAssignPending] = useState(false)

  const { register, handleSubmit, reset } = useForm<FormData>()
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data: projects = [], isLoading } = useProjects()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  const canManageProjects = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const isAdmin = user?.role === 'ADMIN'

  const { data: allUsers = [] } = useQuery<{ id: string; name: string; email: string }[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
    enabled: modal && isAdmin,
  })

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.client ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditProject(null)
    setSelectedColor(COLORS[0])
    setSelectedStatus('ACTIVE')
    setLocalAssignments([])
    reset({ name: '', client: '' })
    setModal(true)
  }

  const openEdit = (p: Project) => {
    setEditProject(p)
    setSelectedColor(p.color)
    setSelectedStatus(p.status ?? 'ACTIVE')
    setLocalAssignments(p.assignments ?? [])
    reset({ name: p.name, client: p.client ?? '' })
    setModal(true)
  }

  const handleSave = (data: FormData) => {
    const payload = { name: data.name, client: data.client || null, color: selectedColor, status: selectedStatus }
    const mutation = editProject
      ? updateProject.mutateAsync({ id: editProject.id, ...payload })
      : createProject.mutateAsync(payload)
    mutation.then(() => setModal(false))
  }

  const addAssignment = async () => {
    if (!editProject || !addUserId) return
    setAssignPending(true)
    try {
      await api.post(`/admin/projects/${editProject.id}/assignments`, { userId: addUserId, accessLevel: 'TRACK' })
      const found = allUsers.find(u => u.id === addUserId)
      if (found) {
        setLocalAssignments(prev => [...prev, { id: addUserId, userId: addUserId, user: found, accessLevel: 'TRACK' }])
      }
      setAddUserId('')
      qc.invalidateQueries({ queryKey: ['projects'] })
    } finally {
      setAssignPending(false)
    }
  }

  const removeAssignment = async (userId: string) => {
    if (!editProject) return
    await api.delete(`/admin/projects/${editProject.id}/assignments?userId=${userId}`)
    setLocalAssignments(prev => prev.filter(a => a.userId !== userId))
    qc.invalidateQueries({ queryKey: ['projects'] })
  }

  const availableUsers = allUsers.filter(u => !localAssignments.some(a => a.userId === u.id))
  const isPending = createProject.isPending || updateProject.isPending

  return (
    <>
      <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-white">Projects</h1>
          <p className="text-xs text-white/40 mt-0.5">
            {canManageProjects ? 'Manage assigned workspace projects' : 'Projects assigned to you'}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(var(--text-faint))' }} />
            <input
              className="input pl-8 text-sm w-full"
              placeholder="Search projects…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
          {canManageProjects && (
            <button className="btn-primary flex-shrink-0" onClick={openCreate}><Plus size={14} />New Project</button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="page-container">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-5 flex flex-col gap-3 animate-pulse" style={{ borderLeft: '3px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10 flex-shrink-0" />
                    <div className="h-3.5 bg-white/10 rounded-md flex-1" />
                    <div className="h-5 w-14 bg-white/10 rounded-full" />
                  </div>
                  <div className="h-2.5 bg-white/[0.06] rounded-md w-1/3 ml-4" />
                  <div className="mt-2 h-6 bg-white/10 rounded-md w-1/2" />
                  <div className="h-2 bg-white/[0.06] rounded-md w-1/4" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 sm:py-24 text-white/30">
              <div className="text-4xl mb-3">📁</div>
              <p className="text-sm">
                {search ? `No projects match "${search}"` : canManageProjects ? 'No projects yet. Create your first!' : 'No assigned projects yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map(p => {
                const sm = STATUS_META[p.status ?? 'ACTIVE']
                const assignees = p.assignments?.filter(a => a.userId) ?? []
                return (
                  <div key={p.id} className="card p-5 group flex flex-col" style={{ borderLeft: `3px solid ${p.color}` }}>
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                        <h3 className="text-sm font-semibold text-white truncate">{p.name}</h3>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {/* Status badge */}
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ color: sm.color, background: sm.bg }}>
                          {sm.label}
                        </span>
                      </div>
                    </div>

                    {p.client && <p className="text-xs text-white/40 mb-2 ml-4 truncate">{p.client}</p>}

                    {/* Actions — appear on hover */}
                    <div className="flex gap-1 mb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/projects/${p.id}`}
                        className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg text-white/30 hover:text-accent hover:bg-accent/10 transition-all"
                        title="Open board"
                      >
                        <LayoutGrid size={11} />Board
                      </Link>
                      {canManageProjects && (
                        <>
                          <button className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all" onClick={() => openEdit(p)}>
                            <Pencil size={11} />Edit
                          </button>
                          <button className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all ml-auto" onClick={() => deleteProject.mutate(p.id)}>
                            <X size={11} />Delete
                          </button>
                        </>
                      )}
                    </div>

                    {/* Time stats */}
                    <div className="mt-auto">
                      <div className="text-xl font-mono font-semibold text-white">{formatDuration(p.totalSeconds ?? 0)}</div>
                      <div className="text-xs text-white/30 mt-0.5">{p.entryCount ?? 0} entries</div>
                    </div>

                    {/* Assigned users */}
                    {assignees.length > 0 && (
                      <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex -space-x-1.5">
                          {assignees.slice(0, 5).map(a => (
                            <div
                              key={a.id}
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', outline: '1.5px solid rgba(var(--bg-card),1)' }}
                              title={a.user?.name}
                            >
                              {a.user?.name?.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {assignees.length > 5 && (
                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/50 flex-shrink-0"
                              style={{ outline: '1.5px solid rgba(var(--bg-card),1)' }}>
                              +{assignees.length - 5}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-white/25">{assignees.length} member{assignees.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
          onClick={e => e.target === e.currentTarget && setModal(false)}
        >
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-[440px] overflow-y-auto rounded-2xl border border-white/10 bg-[rgb(var(--bg-secondary))] p-4 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">{editProject ? 'Edit Project' : 'New Project'}</h2>
              <button className="text-white/40 hover:text-white" onClick={() => setModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
              <div>
                <label className="label">Project name</label>
                <input className="input" placeholder="e.g. Website Redesign" {...register('name', { required: true })} />
              </div>
              <div>
                <label className="label">Client (optional)</label>
                <input className="input" placeholder="e.g. Acme Corp" {...register('client')} />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as ProjectStatus)}
                >
                  {(Object.keys(STATUS_META) as ProjectStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setSelectedColor(c)}
                      className="w-7 h-7 rounded-full transition-all hover:scale-110"
                      style={{ background: c, outline: c === selectedColor ? '3px solid white' : '3px solid transparent', outlineOffset: 2 }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? 'Saving…' : editProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>

            {/* User assignment — edit mode, admin only */}
            {editProject && isAdmin && (
              <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[12px] font-semibold text-white mb-3">Assigned Users</p>

                {/* Current members */}
                {localAssignments.filter(a => a.userId).length === 0 ? (
                  <p className="text-xs text-white/30 mb-3">No users assigned yet.</p>
                ) : (
                  <div className="space-y-1.5 mb-3">
                    {localAssignments.filter(a => a.userId).map(a => (
                      <div key={a.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/[0.03] group/row">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                            {a.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-white">{a.user?.name}</span>
                          <span className="text-[10px] text-white/30">{a.accessLevel}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAssignment(a.userId!)}
                          className="opacity-0 group-hover/row:opacity-100 text-white/25 hover:text-red-400 transition-all"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add user */}
                {availableUsers.length > 0 && (
                  <div className="flex gap-2">
                    <select
                      className="input flex-1 text-sm"
                      value={addUserId}
                      onChange={e => setAddUserId(e.target.value)}
                    >
                      <option value="">Select user to add…</option>
                      {availableUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-primary flex-shrink-0"
                      disabled={!addUserId || assignPending}
                      onClick={addAssignment}
                    >
                      <Check size={13} />{assignPending ? '…' : 'Add'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
