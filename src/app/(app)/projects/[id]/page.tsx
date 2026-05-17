'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, X, Flag, Calendar, Pencil, Check } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/apiClient'
import { useAuthStore } from '@/lib/authStore'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus, TaskPriority } from '@/types'

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TODO',        label: 'To Do',       color: '#6366f1' },
  { status: 'IN_PROGRESS', label: 'In Progress',  color: '#f59e0b' },
  { status: 'IN_REVIEW',   label: 'In Review',    color: '#8b5cf6' },
  { status: 'DONE',        label: 'Done',         color: '#10b981' },
]

const PRIORITY_META: Record<TaskPriority, { color: string; label: string }> = {
  LOW:    { color: '#6b7280', label: 'Low' },
  MEDIUM: { color: '#f59e0b', label: 'Medium' },
  HIGH:   { color: '#ef4444', label: 'High' },
  URGENT: { color: '#dc2626', label: 'Urgent' },
}

interface ProjectData { id: string; name: string; color: string; client?: string | null }

export default function ProjectBoardPage() {
  const params = useParams()
  const projectId = params.id as string
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null)

  // Create-task inline state per column
  const [addingToCol, setAddingToCol] = useState<TaskStatus | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('MEDIUM')
  const today = new Date().toISOString().split('T')[0]
  const [newDueDate, setNewDueDate] = useState(today)

  // Edit task modal
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPriority, setEditPriority] = useState<TaskPriority>('MEDIUM')
  const [editDueDate, setEditDueDate] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const { data: project } = useQuery<ProjectData>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(r => r.data),
  })

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    queryFn: () => api.get(`/projects/${projectId}/tasks`).then(r => r.data),
  })

  const createTask = useMutation({
    mutationFn: (data: { title: string; status: TaskStatus; priority: TaskPriority; dueDate?: string }) =>
      api.post(`/projects/${projectId}/tasks`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      setAddingToCol(null)
      setNewTitle('')
      setNewDueDate('')
    },
  })

  const updateTask = useMutation({
    mutationFn: ({ id, ...data }: Partial<Task> & { id: string }) =>
      api.patch(`/tasks/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      setEditTask(null)
    },
  })

  const deleteTask = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })

  const tasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status)

  const handleDrop = (targetStatus: TaskStatus) => {
    if (draggingId) {
      const task = tasks.find(t => t.id === draggingId)
      if (task && task.status !== targetStatus) {
        updateTask.mutate({ id: draggingId, status: targetStatus })
      }
    }
    setDraggingId(null)
    setDragOverCol(null)
  }

  const openEdit = (task: Task) => {
    setEditTask(task)
    setEditTitle(task.title)
    setEditPriority(task.priority)
    setEditDescription(task.description ?? '')
    setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '')
  }

  const submitEdit = () => {
    if (!editTask || !editTitle.trim()) return
    updateTask.mutate({
      id: editTask.id,
      title: editTitle.trim(),
      priority: editPriority,
      description: editDescription || null,
      dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
    })
  }

  const isOverdue = (dueDate?: string | null) =>
    !!dueDate && new Date(dueDate) < new Date()

  const formatDue = (dueDate: string) =>
    new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const totalCount = tasks.length
  const doneCount = tasks.filter(t => t.status === 'DONE').length
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <>
      {/* Header */}
      <div className="page-header flex items-center gap-3 flex-wrap">
        <Link
          href="/projects"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-white/40 hover:text-white flex-shrink-0"
        >
          <ArrowLeft size={15} />
        </Link>

        {project && (
          <>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: project.color }} />
            <div className="min-w-0">
              <h1 className="text-[15px] font-semibold text-white truncate">{project.name}</h1>
              {project.client && <p className="text-[11px] text-white/30 truncate">{project.client}</p>}
            </div>
          </>
        )}

        {/* Progress */}
        {totalCount > 0 && (
          <div className="ml-auto flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: '#10b981' }}
                />
              </div>
              <span className="text-[11px] text-white/30">{doneCount}/{totalCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <div className="flex gap-4 h-full overflow-x-auto p-4 pb-6">
          {COLUMNS.map(col => {
            const colTasks = tasksByStatus(col.status)
            const isOver = dragOverCol === col.status

            return (
              <div
                key={col.status}
                className="flex flex-col flex-shrink-0 w-[272px] rounded-2xl transition-all duration-150"
                style={{
                  background: isOver ? `${col.color}10` : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${isOver ? col.color + '50' : 'rgba(255,255,255,0.07)'}`,
                }}
                onDragOver={e => { e.preventDefault(); setDragOverCol(col.status) }}
                onDragLeave={e => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null)
                }}
                onDrop={() => handleDrop(col.status)}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <span className="text-[12px] font-semibold text-white">{col.label}</span>
                  <span
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                    style={{ background: `${col.color}20`, color: col.color }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Task list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {isLoading && colTasks.length === 0 && (
                    <div className="space-y-2">
                      {[1, 2].map(i => (
                        <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                      ))}
                    </div>
                  )}

                  {colTasks.map(task => {
                    const pm = PRIORITY_META[task.priority]
                    const overdue = isOverdue(task.dueDate)
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggingId(task.id)}
                        onDragEnd={() => { setDraggingId(null); setDragOverCol(null) }}
                        className={cn(
                          'group relative rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all select-none',
                          draggingId === task.id ? 'opacity-40 scale-95 shadow-none' : 'hover:scale-[1.01] hover:shadow-lg'
                        )}
                        style={{ background: 'rgb(var(--bg-card))', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        {/* Top row: title + actions */}
                        <div className="flex items-start gap-2 mb-2.5">
                          <p className="text-[13px] font-medium text-white leading-snug flex-1 min-w-0 break-words">{task.title}</p>
                          <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(task)}
                              className="w-5 h-5 rounded flex items-center justify-center text-white/20 hover:text-white transition-colors"
                            >
                              <Pencil size={10} />
                            </button>
                            {canManage && (
                              <button
                                onClick={() => deleteTask.mutate(task.id)}
                                className="w-5 h-5 rounded flex items-center justify-center text-white/20 hover:text-red-400 transition-colors"
                              >
                                <X size={11} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${pm.color}18`, color: pm.color }}
                          >
                            <Flag size={8} />{pm.label}
                          </span>

                          {task.dueDate && (
                            <span className={cn('flex items-center gap-1 text-[10px]', overdue ? 'text-red-400' : 'text-white/30')}>
                              <Calendar size={9} />
                              {overdue && 'Overdue · '}{formatDue(task.dueDate)}
                            </span>
                          )}

                          {task.assignee && (
                            <div
                              className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 shadow"
                              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                              title={task.assignee.name}
                            >
                              {task.assignee.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {!isLoading && colTasks.length === 0 && (
                    <div className="flex items-center justify-center h-16 rounded-xl border border-dashed text-[11px] text-white/15 transition-colors"
                      style={{ borderColor: isOver ? col.color + '60' : 'rgba(255,255,255,0.08)' }}>
                      {isOver ? 'Drop here' : 'No tasks'}
                    </div>
                  )}
                </div>

                {/* Add task */}
                <div className="p-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {addingToCol === col.status ? (
                    <div className="space-y-2 animate-fade-in">
                      <input
                        autoFocus
                        className="input text-[12px] py-1.5 w-full"
                        placeholder="Task title…"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newTitle.trim()) {
                            createTask.mutate({
                              title: newTitle.trim(),
                              status: col.status,
                              priority: newPriority,
                              ...(newDueDate && { dueDate: new Date(newDueDate).toISOString() }),
                            })
                          }
                          if (e.key === 'Escape') { setAddingToCol(null); setNewTitle('') }
                        }}
                      />
                      <div className="flex items-center gap-1.5">
                        <select
                          className="input text-[11px] py-1 flex-1"
                          value={newPriority}
                          onChange={e => setNewPriority(e.target.value as TaskPriority)}
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                        <input
                          type="date"
                          className="input text-[11px] py-1 flex-1"
                          value={newDueDate}
                          onChange={e => setNewDueDate(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          className="btn-primary py-1 px-3 text-[11px] flex-1 justify-center"
                          disabled={!newTitle.trim() || createTask.isPending}
                          onClick={() => createTask.mutate({
                            title: newTitle.trim(),
                            status: col.status,
                            priority: newPriority,
                            ...(newDueDate && { dueDate: new Date(newDueDate).toISOString() }),
                          })}
                        >
                          {createTask.isPending ? '…' : 'Add'}
                        </button>
                        <button
                          className="btn-ghost py-1 px-2 text-[11px]"
                          onClick={() => { setAddingToCol(null); setNewTitle('') }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    canManage && (
                      <button
                        onClick={() => { setAddingToCol(col.status); setNewTitle(''); setNewPriority('MEDIUM'); setNewDueDate(today) }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-white/25 hover:text-white/60 hover:bg-white/5 transition-all"
                      >
                        <Plus size={12} />Add task
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Edit task modal */}
      {editTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setEditTask(null)}
        >
          <div className="w-full max-w-sm rounded-2xl p-5 shadow-2xl" style={{ background: 'rgb(var(--bg-secondary))', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Edit Task</h2>
              <button onClick={() => setEditTask(null)} className="text-white/30 hover:text-white">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Title</label>
                <input className="input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Optional description…"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={editPriority} onChange={e => setEditPriority(e.target.value as TaskPriority)}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="label">Due date</label>
                  <input type="date" className="input" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button className="btn-ghost flex-1 justify-center" onClick={() => setEditTask(null)}>Cancel</button>
              <button
                className="btn-primary flex-1 justify-center"
                disabled={!editTitle.trim() || updateTask.isPending}
                onClick={submitEdit}
              >
                <Check size={13} />{updateTask.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
