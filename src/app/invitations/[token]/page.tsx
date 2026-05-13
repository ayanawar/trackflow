'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Building2, Check, X } from 'lucide-react'
import apiClient from '@/lib/apiClient'

interface InviteDetails {
  email: string
  role: string
  organization: { id: string; name: string; slug: string; avatarUrl: string | null }
}

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get(`/invitations/${token}`)
      .then(r => setInvite(r.data))
      .catch(err => setError(err?.response?.data?.error ?? 'Invalid or expired invitation'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    setError('')
    try {
      await apiClient.post(`/invitations/${token}/accept`)
      setAccepted(true)
      setTimeout(() => router.push('/organizations'), 2000)
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg-primary))] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[rgb(var(--bg-secondary))] p-8 shadow-2xl text-center">
        {loading ? (
          <p className="text-white/40 text-sm">Loading invitation…</p>
        ) : error && !invite ? (
          <div>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <X size={24} className="text-red-400" />
            </div>
            <h1 className="text-base font-semibold text-white mb-2">Invalid Invitation</h1>
            <p className="text-sm text-white/40">{error}</p>
          </div>
        ) : accepted ? (
          <div>
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Check size={24} className="text-green-400" />
            </div>
            <h1 className="text-base font-semibold text-white mb-2">Welcome aboard!</h1>
            <p className="text-sm text-white/40">Redirecting to your organizations…</p>
          </div>
        ) : invite ? (
          <div>
            <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-5">
              <Building2 size={28} className="text-accent" />
            </div>
            <h1 className="text-[17px] font-semibold text-white mb-1">You're invited!</h1>
            <p className="text-sm text-white/50 mb-6">
              Join <span className="text-white font-medium">{invite.organization.name}</span> as <span className="text-white font-medium">{invite.role}</span>
            </p>
            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="btn-primary w-full justify-center"
            >
              {accepting ? 'Joining…' : 'Accept Invitation'}
            </button>
            <button
              onClick={() => router.push('/tracker')}
              className="mt-2 w-full text-sm text-white/30 hover:text-white/60 transition-colors py-2"
            >
              Decline
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
