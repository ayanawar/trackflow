'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Plus, Users, ArrowRight, Crown, Shield, Briefcase, User } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useOrganizations, useCreateOrg, useSwitchOrg } from '@/hooks/useOrganization'

const ROLE_ICONS: Record<string, React.ReactNode> = {
  OWNER: <Crown size={11} className="text-yellow-400" />,
  ADMIN: <Shield size={11} className="text-blue-400" />,
  MANAGER: <Briefcase size={11} className="text-green-400" />,
  EMPLOYEE: <User size={11} className="text-white/40" />,
}

export default function OrganizationsPage() {
  const router = useRouter()
  const { data: orgs = [], isLoading } = useOrganizations()
  const createOrg = useCreateOrg()
  const switchOrg = useSwitchOrg()

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')

  function autoSlug(value: string) {
    return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return
    setError('')
    try {
      const org = await createOrg.mutateAsync({ name: name.trim(), slug: slug.trim() })
      setShowCreate(false)
      setName('')
      setSlug('')
      router.push(`/organizations/${org.id}/members`)
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to create organization')
    }
  }

  return (
    <AppShell>
      <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[15px] font-semibold text-white">Organizations</h1>
        <button className="btn-primary w-full sm:w-auto" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New Organization
        </button>
      </div>

      <div className="page-body">
        <div className="page-container">
          {isLoading ? (
            <div className="text-center py-20 text-white/30 text-sm">Loading…</div>
          ) : orgs.length === 0 ? (
            <div className="text-center py-20 text-white/30">
              <Building2 size={40} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">No organizations yet. Create your first!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {orgs.map(org => (
                <div key={org.id} className="card p-5 group flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Building2 size={18} className="text-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{org.name}</h3>
                        <p className="text-[11px] text-white/30 truncate">/{org.slug}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                      {ROLE_ICONS[org.role]}
                      {org.role}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <Link
                      href={`/organizations/${org.id}/members`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/8 border border-white/[0.08] px-3 py-1.5 text-[12px] text-white/70 hover:text-white transition-colors"
                    >
                      <Users size={12} /> Members
                    </Link>
                    <Link
                      href={`/organizations/${org.id}/teams`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/8 border border-white/[0.08] px-3 py-1.5 text-[12px] text-white/70 hover:text-white transition-colors"
                    >
                      <Briefcase size={12} /> Teams
                    </Link>
                    <button
                      onClick={() => switchOrg.mutate(org.id)}
                      disabled={switchOrg.isPending}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/20 px-3 py-1.5 text-[12px] text-accent transition-colors disabled:opacity-50"
                      title="Switch to this organization"
                    >
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
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
            <h2 className="text-base font-semibold text-white mb-5">Create Organization</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Organization name</label>
                <input
                  className="input"
                  placeholder="e.g. Acme Corp"
                  value={name}
                  onChange={e => { setName(e.target.value); setSlug(autoSlug(e.target.value)) }}
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Slug</label>
                <input
                  className="input"
                  placeholder="acme-corp"
                  value={slug}
                  onChange={e => setSlug(autoSlug(e.target.value))}
                />
                <p className="mt-1 text-[11px] text-white/30">Lowercase letters, numbers, and hyphens only</p>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="btn-ghost" onClick={() => { setShowCreate(false); setError('') }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={createOrg.isPending || !name.trim() || !slug.trim()}>
                  {createOrg.isPending ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
