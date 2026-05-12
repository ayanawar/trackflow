'use client'
import { useState } from 'react'
import { Sparkles, Send } from 'lucide-react'
import api from '@/lib/apiClient'
import AppShell from '@/components/layout/AppShell'
import SafeMarkdown from '@/components/ui/SafeMarkdown'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { useStats } from '@/hooks/useStats'
import { useProjects } from '@/hooks/useProjects'

const QUICK_PROMPTS = [
  'Summarize my time tracking this week',
  'Which project needs more focus?',
  'Am I on track to hit 40 hours this week?',
  'Give me 3 productivity tips based on my patterns',
  'What percentage of time is on each project?',
]

export default function InsightsPage() {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: entries = [] } = useTimeEntries(100)
  const { data: stats } = useStats()
  const { data: projects = [] } = useProjects()

  const buildContext = () => ({
    todaySeconds: stats?.todaySeconds ?? 0,
    weekSeconds: stats?.weekSeconds ?? 0,
    monthSeconds: stats?.monthSeconds ?? 0,
    totalEntries: stats?.totalEntries ?? 0,
    projects: projects.map(p => ({
      name: p.name,
      client: p.client ?? null,
      totalSeconds: p.totalSeconds ?? 0,
    })),
    recentEntries: entries.slice(0, 20).map(e => ({
      description: e.description ?? '',
      projectName: e.project?.name ?? null,
      tagName: e.tag?.name ?? null,
      durationSeconds: e.duration ?? 0,
    })),
  })

  const ask = async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setResponse('')
    setErrorMsg('')
    try {
      const res = await api.post('/insights', { question: q, context: buildContext() })
      setResponse(res.data.answer ?? 'No response.')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 429) {
        setErrorMsg('Too many requests. Please wait a moment before asking again.')
      } else {
        setErrorMsg('AI is unavailable, please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="border-b border-white/[0.07] px-7 py-4 flex items-center gap-3 bg-[rgb(var(--bg-secondary))]">
        <Sparkles size={15} className="text-accent-purple" />
        <div>
          <h1 className="text-[15px] font-semibold text-white">AI Insights</h1>
          <p className="text-xs text-white/40 mt-0.5">Powered by Claude</p>
        </div>
      </div>

      <div className="p-7 max-w-3xl flex-1 overflow-y-auto">
        <div className="card p-5 mb-6">
          <div className="flex gap-3">
            <input
              className="input flex-1"
              placeholder="Ask about your time data…"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && ask(question)}
            />
            <button className="btn-primary flex-shrink-0" onClick={() => ask(question)} disabled={loading}>
              <Send size={14} />{loading ? 'Thinking…' : 'Ask'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_PROMPTS.map(p => (
              <button key={p}
                className="text-[12px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-accent-purple hover:border-accent-purple/40 transition-all"
                onClick={() => { setQuestion(p); ask(p) }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="card p-5 border-l-2 border-accent-red">
            <p className="text-sm text-accent-red">{errorMsg}</p>
          </div>
        )}

        {(response || loading) && !errorMsg && (
          <div className="card p-5 border-l-2 border-accent-purple">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={13} className="text-accent-purple" />
              <span className="text-xs font-medium text-accent-purple">Claude</span>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" />
                Analyzing your data…
              </div>
            ) : (
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                <SafeMarkdown text={response} />
              </p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
