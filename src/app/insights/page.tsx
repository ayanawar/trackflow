'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, Send } from 'lucide-react'
import api from '@/lib/apiClient'
import AppShell from '@/components/layout/AppShell'
import { formatDuration } from '@/lib/utils'
import type { TimeEntry, Project, Stats } from '@/types'

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
  const [loading, setLoading] = useState(false)

  const { data: entries = [] } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries'],
    queryFn: () => api.get('/time-entries?limit=100').then(r => r.data),
  })
  const { data: stats } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: () => api.get('/stats').then(r => r.data),
  })
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
  })

  const buildContext = () => {
    const projSummary = projects.map(p => `- ${p.name}${p.client ? ` (${p.client})` : ''}: ${formatDuration(p.totalSeconds ?? 0)}`).join('\n')
    const recent = entries.slice(0, 20).map(e => `- "${e.description}" | ${e.project?.name ?? 'No project'} | ${e.tag?.name ?? 'no tag'} | ${formatDuration(e.duration ?? 0)}`).join('\n')
    return `Time tracking summary:
Today: ${formatDuration(stats?.todaySeconds ?? 0)}
This week: ${formatDuration(stats?.weekSeconds ?? 0)} (goal: 40h)
This month: ${formatDuration(stats?.monthSeconds ?? 0)}
Total entries: ${stats?.totalEntries ?? 0}

Projects:\n${projSummary || 'None'}

Recent 20 entries:\n${recent || 'None'}`
  }

  const ask = async (q: string) => {
    if (!q.trim()) return
    setLoading(true); setResponse('')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          system: 'You are an AI assistant inside TrackFlow, a time tracking app. Analyze the user\'s data and give concise, actionable advice. Use bullet points for lists. Keep responses under 200 words.',
          messages: [{ role: 'user', content: `${buildContext()}\n\nQuestion: ${q}` }],
        }),
      })
      const data = await res.json()
      setResponse(data.content?.[0]?.text ?? 'No response.')
    } catch {
      setResponse('Error contacting AI. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="page-header flex items-center gap-3">
        <Sparkles size={15} className="text-accent-purple" />
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-white">AI Insights</h1>
          <p className="text-xs text-white/40 mt-0.5">Powered by Claude</p>
        </div>
      </div>

      <div className="page-body">
        <div className="mx-auto w-full max-w-3xl">
        <div className="card p-4 sm:p-5 mb-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="input flex-1"
              placeholder="Ask about your time data…"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && ask(question)}
            />
            <button className="btn-primary flex-shrink-0 w-full sm:w-auto" onClick={() => ask(question)} disabled={loading}>
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

        {(response || loading) && (
          <div className="card p-4 sm:p-5 border-l-2 border-accent-purple">
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
              <div
                className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{
                  __html: response
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                    .replace(/\n/g, '<br>'),
                }}
              />
            )}
          </div>
        )}
        </div>
      </div>
    </AppShell>
  )
}
