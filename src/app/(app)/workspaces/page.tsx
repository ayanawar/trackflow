'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Building2, Plus, Trash2, Check, Repeat2 } from 'lucide-react'
import { useWorkspaces, useCreateWorkspace, useSwitchWorkspace, type WorkspaceSummary } from '@/hooks/useWorkspaces'
import DeleteWorkspaceDialog from '@/components/workspace/DeleteWorkspaceDialog'

interface CreateFormData {
  name: string
}

export default function WorkspacesPage() {
  const router = useRouter()
  const { data: workspaces = [], isLoading } = useWorkspaces()
  const createMutation = useCreateWorkspace()
  const switchMutation = useSwitchWorkspace()
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceSummary | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFormData>({ mode: 'onSubmit' })

  // Group workspaces by org for friendlier rendering
  const byOrg = new Map<string, WorkspaceSummary[]>()
  for (const w of workspaces) {
    if (!byOrg.has(w.orgId)) byOrg.set(w.orgId, [])
    byOrg.get(w.orgId)!.push(w)
  }
  // New workspaces are created in the active workspace's organization.
  const createOrgId = workspaces.find(w => w.isActive)?.orgId ?? workspaces[0]?.orgId ?? null

  return (
    <>
      <div className="page-header sticky top-0 z-10 backdrop-blur" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="page-container flex items-center justify-between py-4">
          <div>
            <h1 className="text-xl font-bold">Workspaces</h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
              Create or switch between isolated data scopes inside your organization.
            </p>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="page-container py-6 space-y-8">
          {isLoading && <p className="text-sm" style={{ color: 'rgb(var(--text-faint))' }}>Loading…</p>}

          {!isLoading && createOrgId && (
            <form
              onSubmit={handleSubmit(data => {
                createMutation.mutate(
                  { orgId: createOrgId, name: data.name },
                  {
                    onSuccess: workspace => {
                      reset()
                      switchMutation.mutate(workspace.id, {
                        onSuccess: () => router.refresh(),
                      })
                    },
                  },
                )
              })}
              className="rounded-xl p-4"
              style={{ background: 'rgb(var(--bg-card))', border: '1px solid var(--border)' }}
            >
              <h2 className="text-sm font-medium mb-3">Create a workspace</h2>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(var(--text-faint))' }} />
                  <input
                    className="input pl-9"
                    placeholder="e.g. R&D, Client Projects"
                    maxLength={60}
                    {...register('name', {
                      required: 'Workspace name is required.',
                      maxLength: { value: 60, message: 'Workspace name must be 60 characters or fewer.' },
                      validate: value => value.trim().length > 0 || 'Workspace name is required.',
                    })}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createMutation.isPending || switchMutation.isPending}
                >
                  <Plus size={14} /> Create
                </button>
              </div>
              {errors.name && (
                <p className="text-xs text-red-400 mt-2">{errors.name.message}</p>
              )}
              {createMutation.isError && (
                <p className="text-xs text-red-400 mt-2">
                  {(createMutation.error as any)?.response?.data?.error ?? 'Could not create workspace.'}
                </p>
              )}
            </form>
          )}

          {Array.from(byOrg.entries()).map(([orgId, list]) => (
            <section key={orgId} className="space-y-3">
              <div className="grid gap-2">
                {list.map(w => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: 'rgb(var(--bg-card))', border: '1px solid var(--border)' }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{w.name}</span>
                        {w.isActive && (
                          <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                            <Check size={10} /> active
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgb(var(--bg-primary))', color: 'rgb(var(--text-faint))' }}>
                          {w.role}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-faint))' }}>
                        {w.memberCount} {w.memberCount === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!w.isActive && (
                        <button
                          type="button"
                          onClick={() => {
                            switchMutation.mutate(w.id, {
                              onSuccess: () => router.refresh(),
                            })
                          }}
                          className="btn-secondary"
                          disabled={switchMutation.isPending}
                        >
                          <Repeat2 size={14} /> Switch
                        </button>
                      )}
                      {w.role === 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(w)}
                          className="p-2 rounded-lg hover:bg-white/5"
                          title="Delete workspace"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <DeleteWorkspaceDialog
        workspace={deleteTarget ?? { id: '', name: '' }}
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  )
}
