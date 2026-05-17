'use client'
import { useState } from 'react'
import { Sparkles, Send, RefreshCw, MessageSquare, Lightbulb } from 'lucide-react'
import api from '@/lib/apiClient'
import SafeMarkdown from '@/components/ui/SafeMarkdown'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { useStats } from '@/hooks/useStats'
import { useProjects } from '@/hooks/useProjects'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

function formatHours(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

interface WeeklySummaryData {
  summary: string
  suggestions: string[]
}

export default function InsightsPage() {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: entries = [] } = useTimeEntries(100)
  const { data: stats } = useStats()
  const { data: projects = [] } = useProjects()

  const { data: weeklySummary, isLoading: summaryLoading, refetch: refetchSummary, isError: summaryError } = useQuery<WeeklySummaryData>({
    queryKey: ['ai-weekly-summary'],
    queryFn: () => api.get('/ai/weekly-summary').then(r => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

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
      const res = await api.post('/ai/query', { question: q, context: buildContext() })
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

  const suggestions = weeklySummary?.suggestions ?? []

  return (
    <>
      <div className="page-header flex items-center gap-3">
        <Sparkles size={15} className="text-accent-purple" />
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-white">AI Insights</h1>
        </div>
      </div>

      <div className="page-body">
        <div className="mx-auto w-full max-w-3xl flex flex-col gap-5">

          {/* Weekly Summary Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-accent-purple" />
                <span className="text-xs font-semibold text-accent-purple uppercase tracking-wider">Weekly Summary</span>
              </div>
              <button
                onClick={() => refetchSummary()}
                disabled={summaryLoading}
                className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
              >
                <RefreshCw size={11} className={cn(summaryLoading && 'animate-spin')} />
                Refresh
              </button>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-white/30 uppercase tracking-wider">This week</span>
                <span className="text-lg font-mono font-semibold text-white">{formatHours(stats?.weekSeconds ?? 0)}</span>
              </div>
              <div className="w-px bg-white/[0.07]" />
              <div className="flex flex-col">
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Today</span>
                <span className="text-lg font-mono font-semibold text-white">{formatHours(stats?.todaySeconds ?? 0)}</span>
              </div>
              <div className="w-px bg-white/[0.07]" />
              <div className="flex flex-col">
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Entries</span>
                <span className="text-lg font-mono font-semibold text-white">{stats?.totalEntries ?? 0}</span>
              </div>
            </div>

            {summaryLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-white/[0.06] rounded-full w-full" />
                <div className="h-3 bg-white/[0.06] rounded-full w-5/6" />
                <div className="h-3 bg-white/[0.06] rounded-full w-4/6" />
              </div>
            ) : summaryError || !weeklySummary ? (
              <p className="text-sm text-white/30 italic">
                {summaryError ? 'Could not load AI summary — check your GEMINI_API_KEY.' : 'No data yet this week.'}
              </p>
            ) : (
              <p className="text-sm text-white/70 leading-relaxed">{weeklySummary.summary}</p>
            )}
          </div>

          {/* NL Query Box */}
          <div className="card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={13} className="text-white/40" />
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Ask anything</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="input flex-1"
                placeholder="e.g. How many hours this week? Which project is most active?"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && ask(question)}
              />
              <button
                className="btn-primary flex-shrink-0 w-full sm:w-auto"
                onClick={() => ask(question)}
                disabled={loading || !question.trim()}
              >
                <Send size={14} />{loading ? 'Thinking…' : 'Ask'}
              </button>
            </div>

            {/* AI-generated smart suggestions */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {suggestions.map(s => (
                  <button
                    key={s}
                    className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-accent-purple hover:border-accent-purple/40 transition-all"
                    onClick={() => { setQuestion(s); ask(s) }}
                  >
                    <Lightbulb size={10} />
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Fallback static suggestions while loading */}
            {summaryLoading && (
              <div className="flex flex-wrap gap-2 mt-3">
                {['How many hours this week?', 'Which project took most time?', 'Am I on track for 40h?'].map(s => (
                  <div key={s} className="h-7 w-36 rounded-full bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            )}
          </div>

          {/* Response / Error */}
          {errorMsg && (
            <div className="card p-5 border-l-2 border-accent-red">
              <p className="text-sm text-accent-red">{errorMsg}</p>
            </div>
          )}

          {(response || loading) && !errorMsg && (
            <div className="card p-5 border-l-2 border-accent-purple">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={13} className="text-accent-purple" />
                <span className="text-xs font-medium text-accent-purple">AI Answer</span>
              </div>
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-white/[0.06] rounded-full w-full" />
                  <div className="h-3 bg-white/[0.06] rounded-full w-4/5" />
                  <div className="h-3 bg-white/[0.06] rounded-full w-3/5" />
                </div>
              ) : (
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                  <SafeMarkdown text={response} />
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
