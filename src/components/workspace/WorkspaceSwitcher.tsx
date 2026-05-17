'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useWorkspaces, useSwitchWorkspace } from '@/hooks/useWorkspaces'
import { useActiveWorkspace } from '@/hooks/useActiveWorkspace'
import { cn } from '@/lib/utils'

interface Props {
  align?: 'left' | 'right'
}

export default function WorkspaceSwitcher({ align = 'right' }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { data: workspaces = [], isLoading } = useWorkspaces()
  const switchMutation = useSwitchWorkspace()
  const active = useActiveWorkspace()

  if (isLoading) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition"
        style={{ background: 'rgb(var(--bg-elevated))', border: '1px solid var(--border)', color: 'rgb(var(--text-base))' }}
      >
        <span className="font-medium truncate max-w-[140px]">{active.name ?? 'Select workspace'}</span>
        <ChevronDown size={14} style={{ color: 'rgb(var(--text-faint))' }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className={cn(
              'absolute mt-1 w-[min(16rem,calc(100vw-1rem))] rounded-xl shadow-2xl z-40 overflow-hidden',
              align === 'left' ? 'left-0' : 'right-0',
            )}
            style={{ background: 'rgb(var(--bg-secondary))', border: '1px solid var(--border)' }}
          >
            <div className="px-3 py-2 text-[11px] uppercase tracking-wider" style={{ color: 'rgb(var(--text-faint))' }}>
              Workspaces
            </div>
            <ul className="max-h-72 overflow-auto">
              {workspaces.map(w => (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => {
                      switchMutation.mutate(w.id, {
                        onSuccess: () => {
                          setOpen(false)
                          router.refresh()
                        },
                      })
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-white/5 transition"
                    disabled={switchMutation.isPending}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{w.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgb(var(--bg-elevated))', color: 'rgb(var(--text-faint))' }}>
                        {w.role}
                      </span>
                    </span>
                    {w.isActive && <Check size={14} className="text-accent" />}
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t" style={{ borderColor: 'var(--border)' }}>
              <Link
                href="/workspaces"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5 transition"
              >
                <Plus size={14} />
                <span>New or manage workspace</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
