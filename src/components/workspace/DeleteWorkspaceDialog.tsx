'use client'

import { useState } from 'react'
import { useDeleteWorkspace } from '@/hooks/useWorkspaces'
import { AlertTriangle } from 'lucide-react'

interface Props {
  workspace: { id: string; name: string }
  open: boolean
  onClose: () => void
  onDeleted?: () => void
}

interface BlockedUsers {
  blockedUsers?: { userId: string; email: string }[]
  error?: string
}

export default function DeleteWorkspaceDialog({ workspace, open, onClose, onDeleted }: Props) {
  const [confirmName, setConfirmName] = useState('')
  const [blocked, setBlocked] = useState<BlockedUsers | null>(null)
  const mutation = useDeleteWorkspace()

  if (!open) return null

  const matches = confirmName === workspace.name
  const isOrphanError = blocked?.blockedUsers && blocked.blockedUsers.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ background: 'rgb(var(--bg-secondary))', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)' }}>
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Delete workspace?</h3>
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
              This permanently deletes <strong>{workspace.name}</strong> and all of its projects, tasks,
              time entries, tags, clients, and reports. This cannot be undone.
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <label className="label">
            Type <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgb(var(--bg-elevated))' }}>{workspace.name}</span> to confirm
          </label>
          <input
            className="input"
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            placeholder="Workspace name"
            autoFocus
          />
        </div>

        {isOrphanError && (
          <div className="text-xs px-3 py-2.5 rounded-xl mb-4" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <p className="text-red-400 font-medium mb-1">{blocked!.error}</p>
            <ul className="text-red-300/80 list-disc list-inside">
              {blocked!.blockedUsers!.map(u => (
                <li key={u.userId}>{u.email}</li>
              ))}
            </ul>
          </div>
        )}

        {mutation.isError && !isOrphanError && (
          <div className="text-xs text-red-400 px-3 py-2.5 rounded-xl mb-4" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
            {(mutation.error as any)?.response?.data?.error ?? 'Could not delete this workspace.'}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button
            type="button"
            disabled={!matches || mutation.isPending}
            onClick={() => {
              setBlocked(null)
              mutation.mutate(
                { id: workspace.id, confirmName },
                {
                  onSuccess: () => {
                    onDeleted?.()
                    onClose()
                  },
                  onError: (err: any) => {
                    if (err.response?.status === 409) {
                      setBlocked(err.response.data)
                    }
                  },
                },
              )
            }}
            className="px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
            style={{ background: matches ? '#ef4444' : 'rgba(239,68,68,0.3)', color: 'white' }}
          >
            {mutation.isPending ? 'Deleting…' : 'Delete forever'}
          </button>
        </div>
      </div>
    </div>
  )
}
