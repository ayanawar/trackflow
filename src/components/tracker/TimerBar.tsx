'use client'
import { useState, useEffect, useRef } from 'react'
import { Play, Square, Folder } from 'lucide-react'
import TagInput from '@/components/tracker/TagInput'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import { formatSeconds, cn } from '@/lib/utils'
import type { Project, TimeEntry } from '@/types'

interface Props {
  projects: Project[]
  runningEntry?: TimeEntry | null
}

export default function TimerBar({ projects, runningEntry }: Props) {
  const qc = useQueryClient()
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [tag, setTag] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [showProjects, setShowProjects] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRunning = !!runningEntry

  useEffect(() => {
    if (runningEntry) {
      setDescription(runningEntry.description ?? '')
      setProjectId(runningEntry.projectId)
      const tick = () => setElapsed(Math.floor((Date.now() - new Date(runningEntry.startTime).getTime()) / 1000))
      tick()
      intervalRef.current = setInterval(tick, 1000)
    } else {
      setElapsed(0)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [runningEntry])

  const startMutation = useMutation({
    mutationFn: () => api.post('/time-entries', { description, projectId, tag: tag || null, startTime: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timeEntries'] }); qc.invalidateQueries({ queryKey: ['stats'] }) },
  })

  const stopMutation = useMutation({
    mutationFn: () => api.patch(`/time-entries/${runningEntry?.id}/stop`, { endTime: new Date().toISOString() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeEntries'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      setDescription(''); setProjectId(null); setTag('')
    },
  })

  const handleToggle = () => isRunning ? stopMutation.mutate() : startMutation.mutate()
  const activeProject = projects.find(p => p.id === projectId)

  return (
    <div className="card flex items-center gap-3 px-4 py-3.5 mb-7">
      <input
        className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30"
        placeholder="What are you working on?"
        value={description}
        onChange={e => setDescription(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !isRunning && handleToggle()}
      />

      {/* Project picker */}
      <div className="relative">
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 border border-white/10 hover:border-white/20 transition-all"
          onClick={() => setShowProjects(v => !v)}
        >
          {activeProject
            ? <><span className="w-2 h-2 rounded-full" style={{ background: activeProject.color }} />{activeProject.name}</>
            : <><Folder size={11} />Project</>}
        </button>
        {showProjects && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-[rgb(var(--bg-secondary))] border border-white/10 rounded-xl p-1 z-30 shadow-xl">
            <button className="w-full text-left text-xs px-3 py-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white" onClick={() => { setProjectId(null); setShowProjects(false) }}>No project</button>
            {projects.map(p => (
              <button key={p.id} className="w-full text-left text-xs px-3 py-2 rounded-lg text-white hover:bg-white/5 flex items-center gap-2" onClick={() => { setProjectId(p.id); setShowProjects(false) }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />{p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tag */}
      <TagInput value={tag} onSelect={setTag} />

      <div className="w-px h-6 bg-white/[0.07]" />

      <span className={cn('font-mono text-xl font-medium min-w-[90px] text-right tabular-nums', isRunning ? 'text-accent-green' : 'text-white/60')}>
        {formatSeconds(elapsed)}
      </span>

      <button
        onClick={handleToggle}
        disabled={startMutation.isPending || stopMutation.isPending}
        className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:brightness-110 active:scale-95', isRunning ? 'bg-accent-red' : 'bg-accent-green')}
      >
        {isRunning
          ? <Square size={14} fill="white" className="text-white" />
          : <Play size={14} fill="white" className="text-white ml-0.5" />}
      </button>
    </div>
  )
}
