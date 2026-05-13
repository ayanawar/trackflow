'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronDown, Plus, Check } from 'lucide-react'
import { useOrganizations, useCreateOrg, useSwitchOrg } from '@/hooks/useOrganization'
import { cn } from '@/lib/utils'

interface Props {
  activeOrgId?: string | null
}

export default function OrgSwitcher({ activeOrgId }: Props) {
  const router = useRouter()
  const { data: orgs = [], isLoading } = useOrganizations()
  const createOrg = useCreateOrg()
  const switchOrg = useSwitchOrg()

  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')

  const activeOrg = orgs.find(o => o.id === activeOrgId)

  function autoSlug(value: string) {
    return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return
    setError('')
    try {
      await createOrg.mutateAsync({ name: name.trim(), slug: slug.trim() })
      setShowCreate(false)
      setName('')
      setSlug('')
      setOpen(false)
      router.push('/organizations')
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to create organization')
    }
  }

  if (isLoading) return null

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(o => !o); setShowCreate(false) }}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0">
          <Building2 size={12} className="text-accent" />
        </div>
        <span className="flex-1 min-w-0 text-[12px] font-medium text-white/70 truncate">
          {activeOrg?.name ?? 'No organization'}
        </span>
        <ChevronDown size={12} className={cn('text-white/30 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-white/[0.08] bg-[rgb(var(--bg-secondary))] shadow-xl py-1">
          {orgs.length > 0 && (
            <>
              <p className="px-3 pt-1 pb-1.5 text-[10px] uppercase tracking-widest text-white/25 font-medium">
                Organizations
              </p>
              {orgs.map(org => (
                <button
                  key={org.id}
                  onClick={() => {
                    setOpen(false)
                    if (org.id !== activeOrgId) switchOrg.mutate(org.id)
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="w-5 h-5 rounded bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Building2 size={10} className="text-accent" />
                  </div>
                  <span className="flex-1 min-w-0 text-[12.5px] text-white/80 truncate">{org.name}</span>
                  {org.id === activeOrgId && <Check size={12} className="text-accent flex-shrink-0" />}
                </button>
              ))}
              <div className="my-1 border-t border-white/[0.06]" />
            </>
          )}

          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-white/5 transition-colors text-white/50 hover:text-white"
            >
              <Plus size={13} />
              <span className="text-[12.5px]">Create organization</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="px-3 py-2 space-y-2">
              <input
                autoFocus
                placeholder="Organization name"
                value={name}
                onChange={e => { setName(e.target.value); setSlug(autoSlug(e.target.value)) }}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50"
              />
              <input
                placeholder="slug (e.g. my-company)"
                value={slug}
                onChange={e => setSlug(autoSlug(e.target.value))}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50"
              />
              {error && <p className="text-[11px] text-red-400">{error}</p>}
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  disabled={createOrg.isPending || !name.trim() || !slug.trim()}
                  className="flex-1 rounded-lg bg-accent px-2 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
                >
                  {createOrg.isPending ? 'Creating…' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setError('') }}
                  className="rounded-lg border border-white/10 px-2 py-1.5 text-[12px] text-white/50 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <button
            onClick={() => { setOpen(false); router.push('/organizations') }}
            className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-white/5 transition-colors text-white/40 hover:text-white/70"
          >
            <span className="text-[12px]">Manage organizations →</span>
          </button>
        </div>
      )}
    </div>
  )
}
