'use client'

import { useEffect, useState } from 'react'
import { Check, Palette, Pencil, Plus, Tags, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { useCreateTag, useDeactivateTag, useDeleteTag, useManageTags, useUpdateTag } from '@/hooks/useTags'
import type { Tag } from '@/types'

const DEFAULT_COLORS = ['#4f8ef7', '#34d399', '#fbbf24', '#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#888888']

function errorMessage(err: any) {
  return err?.response?.data?.error ?? 'Action failed. Try again.'
}

export default function AdminTagsPage() {
  const { user, isLoading: authLoading } = useAuthStore()
  const router = useRouter()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  useEffect(() => {
    if (!authLoading && user && !canManage) router.replace('/tracker')
  }, [authLoading, user, canManage, router])

  const { data: tags = [], isLoading } = useManageTags()
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const deactivateTag = useDeactivateTag()
  const deleteTag = useDeleteTag()

  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLORS[0])
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState(DEFAULT_COLORS[0])
  const [message, setMessage] = useState<string | null>(null)

  const activeCount = tags.filter(t => t.status !== 'INACTIVE').length

  const startEdit = (tag: Tag) => {
    setEditId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
    setMessage(null)
  }

  const handleCreate = async () => {
    setMessage(null)
    try {
      await createTag.mutateAsync({ name, color })
      setName('')
      setColor(DEFAULT_COLORS[0])
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  const handleUpdate = async (id: string) => {
    setMessage(null)
    try {
      await updateTag.mutateAsync({ id, name: editName, color: editColor })
      setEditId(null)
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  if (authLoading || !canManage) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-white/15 border-t-accent animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="page-header flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10">
            <Tags size={14} className="text-white" />
          </div>
          <h1 className="text-[15px] font-semibold text-white">Tags</h1>
          {!isLoading && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/60">
              {activeCount} active / {tags.length} total
            </span>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="page-container max-w-4xl space-y-5">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Plus size={14} className="text-accent" />
              <p className="text-sm font-semibold text-white">Create tag</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <input
                className="input"
                placeholder="Tag name"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && name.trim() && handleCreate()}
              />
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <Palette size={13} className="text-white/40" />
                {DEFAULT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`h-5 w-5 rounded-full border ${color === c ? 'border-white' : 'border-white/10'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    title={c}
                  />
                ))}
              </div>
              <button className="btn-primary" disabled={!name.trim() || createTag.isPending} onClick={handleCreate}>
                {createTag.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
            {message && <p className="mt-3 text-xs text-red-300">{message}</p>}
          </div>

          <div className="card overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-sm text-white/40">Loading tags...</div>
            ) : tags.length === 0 ? (
              <div className="p-10 text-center">
                <Tags size={28} className="mx-auto mb-3 text-white/25" />
                <p className="text-sm font-semibold text-white">No tags yet</p>
                <p className="mt-1 text-xs text-white/40">Create the first workspace tag above.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {tags.map(tag => (
                  <div key={tag.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    {editId === tag.id ? (
                      <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
                        <input className="input" value={editName} onChange={e => setEditName(e.target.value)} />
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                          {DEFAULT_COLORS.map(c => (
                            <button
                              key={c}
                              type="button"
                              className={`h-5 w-5 rounded-full border ${editColor === c ? 'border-white' : 'border-white/10'}`}
                              style={{ backgroundColor: c }}
                              onClick={() => setEditColor(c)}
                              title={c}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-primary" onClick={() => handleUpdate(tag.id)} disabled={!editName.trim() || updateTag.isPending}>
                            <Check size={13} />Save
                          </button>
                          <button className="btn-ghost" onClick={() => setEditId(null)}><X size={13} />Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{tag.name}</p>
                            <p className="text-xs text-white/35">
                              {tag.status === 'INACTIVE' ? 'Inactive' : 'Active'} · {tag.usageCount ?? 0} entries
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {tag.status === 'INACTIVE' ? (
                            <button className="btn-ghost" onClick={() => updateTag.mutate({ id: tag.id, status: 'ACTIVE' })}>
                              Reactivate
                            </button>
                          ) : (
                            <button className="btn-ghost" onClick={() => deactivateTag.mutate(tag.id)}>
                              Deactivate
                            </button>
                          )}
                          <button className="btn-ghost" onClick={() => startEdit(tag)}>
                            <Pencil size={13} />Edit
                          </button>
                          <button
                            className="btn-ghost hover:text-red-300"
                            onClick={() => deleteTag.mutate(tag.id, { onError: err => setMessage(errorMessage(err)) })}
                            disabled={!tag.canDelete || deleteTag.isPending}
                            title={tag.canDelete ? 'Delete unused tag' : 'Used tags can be deactivated instead'}
                          >
                            <Trash2 size={13} />Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
