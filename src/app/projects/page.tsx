'use client'
import { useState } from 'react'
import { Plus, X, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import AppShell from '@/components/layout/AppShell'
import { formatDuration } from '@/lib/utils'
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects'
import type { Project } from '@/types'

const COLORS = ['#4f8ef7', '#7c6fef', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#6ee7b7']

interface FormData { name: string; client: string }

export default function ProjectsPage() {
  const [modal, setModal] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const { register, handleSubmit, reset } = useForm<FormData>()

  const { data: projects = [] } = useProjects()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  const openCreate = () => { setEditProject(null); setSelectedColor(COLORS[0]); reset({ name: '', client: '' }); setModal(true) }
  const openEdit = (p: Project) => { setEditProject(p); setSelectedColor(p.color); reset({ name: p.name, client: p.client ?? '' }); setModal(true) }

  const handleSave = (data: FormData) => {
    const payload = { name: data.name, client: data.client || null, color: selectedColor }
    const mutation = editProject
      ? updateProject.mutateAsync({ id: editProject.id, ...payload })
      : createProject.mutateAsync(payload)
    mutation.then(() => setModal(false))
  }

  const isPending = createProject.isPending || updateProject.isPending

  return (
    <AppShell>
      <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[15px] font-semibold text-white">Projects</h1>
        <button className="btn-primary w-full sm:w-auto" onClick={openCreate}><Plus size={14} /> New Project</button>
      </div>

      <div className="page-body">
        <div className="page-container">
          {projects.length === 0 ? (
            <div className="text-center py-20 sm:py-24 text-white/30">
              <div className="text-4xl mb-3">📁</div>
              <p className="text-sm">No projects yet. Create your first!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map(p => (
                <div key={p.id} className="card p-5 group" style={{ borderLeft: `3px solid ${p.color}` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      <h3 className="text-sm font-semibold text-white truncate">{p.name}</h3>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                      <button className="text-white/30 hover:text-white transition-colors p-0.5" onClick={() => openEdit(p)}>
                        <Pencil size={12} />
                      </button>
                      <button className="text-white/30 hover:text-accent-red transition-colors p-0.5" onClick={() => deleteProject.mutate(p.id)}>
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                  {p.client && <p className="text-xs text-white/40 mb-3 ml-4 truncate">{p.client}</p>}
                  <div className="text-xl sm:text-2xl font-mono font-semibold text-white mt-3 break-words">{formatDuration(p.totalSeconds ?? 0)}</div>
                  <div className="text-xs text-white/30 mt-1">{p.entryCount ?? 0} entries</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-[400px] overflow-y-auto rounded-2xl border border-white/10 bg-[rgb(var(--bg-secondary))] p-4 shadow-2xl sm:p-6">
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
          </div>
        </div>
      )}
    </AppShell>
  )
}
