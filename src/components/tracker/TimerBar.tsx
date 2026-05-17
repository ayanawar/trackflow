'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Square, Pause, Folder, DollarSign, Mic, MicOff, Check, Loader2 } from 'lucide-react'
import TagInput from '@/components/tracker/TagInput'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import { formatSeconds, cn } from '@/lib/utils'
import type { Project, TimeEntry, Task } from '@/types'

interface Props {
  projects: Project[]
  runningEntry?: TimeEntry | null
}

export default function TimerBar({ projects, runningEntry }: Props) {
  const qc = useQueryClient()
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [tag, setTag] = useState('')
  const [billable, setBillable] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [showProjects, setShowProjects] = useState(false)
  // Optimistic local state so buttons respond instantly before server round-trip
  const [optimisticState, setOptimisticState] = useState<'running' | 'paused' | 'stopped' | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const projectPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSpeechSupported(
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    )
  }, [])

  useEffect(() => {
    if (!showProjects) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!projectPickerRef.current?.contains(event.target as Node)) {
        setShowProjects(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [showProjects])

  const toggleSpeech = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const w = window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }
    const SR = w.webkitSpeechRecognition ?? window.SpeechRecognition
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setDescription(prev => prev ? `${prev} ${transcript}` : transcript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isListening])

  const _isRunning = !!runningEntry && runningEntry.isRunning
  const _isPaused  = !!runningEntry && runningEntry.isPaused

  // Clear optimistic state once the server state has caught up (avoids flicker)
  useEffect(() => {
    if (optimisticState === null) return
    if (optimisticState === 'running' && _isRunning)              setOptimisticState(null)
    if (optimisticState === 'paused'  && _isPaused)               setOptimisticState(null)
    if (optimisticState === 'stopped' && !_isRunning && !_isPaused) setOptimisticState(null)
  }, [_isRunning, _isPaused, optimisticState])

  const isRunning  = optimisticState === 'running'  || (optimisticState === null && _isRunning)
  const isPaused   = optimisticState === 'paused'   || (optimisticState === null && _isPaused)
  const isActive   = optimisticState === 'stopped'  ? false
                   : optimisticState !== null        ? true
                   : _isRunning || _isPaused

  useEffect(() => {
    if (runningEntry) {
      setDescription(runningEntry.description ?? '')
      setProjectId(runningEntry.projectId)
      setTaskId(runningEntry.taskId ?? null)
      setTag(runningEntry.tag?.name ?? '')
      setBillable(runningEntry.billable)
    }

    if (runningEntry?.isRunning) {
      const base = runningEntry.pausedDuration
      const tick = () => setElapsed(base + Math.floor((Date.now() - new Date(runningEntry.startTime).getTime()) / 1000))
      tick()
      intervalRef.current = setInterval(tick, 1000)
    } else if (runningEntry?.isPaused) {
      setElapsed(runningEntry.pausedDuration)
      if (intervalRef.current) clearInterval(intervalRef.current)
    } else {
      setElapsed(0)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [runningEntry])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['timeEntries'] })
    qc.invalidateQueries({ queryKey: ['tags'] })
    qc.invalidateQueries({ queryKey: ['stats'] })
  }

  const startMutation = useMutation({
    mutationFn: () => api.post('/time-entries', {
      description, projectId, taskId: taskId || null, tag: tag || null, billable,
      startTime: new Date().toISOString(),
    }),
    onMutate: () => setOptimisticState('running'),
    onSuccess: invalidate,
    onError: () => setOptimisticState(null),
  })

  const stopMutation = useMutation({
    mutationFn: () => api.patch(`/time-entries/${runningEntry?.id}/stop`, { endTime: new Date().toISOString() }),
    onMutate: () => setOptimisticState('stopped'),
    onSuccess: () => {
      invalidate()
      setDescription(''); setProjectId(null); setTaskId(null); setTag(''); setBillable(false)
    },
    onError: () => setOptimisticState(null),
  })

  const pauseMutation = useMutation({
    mutationFn: () => api.patch(`/time-entries/${runningEntry?.id}/pause`),
    onMutate: () => setOptimisticState('paused'),
    onSuccess: invalidate,
    onError: () => setOptimisticState(null),
  })

  const resumeMutation = useMutation({
    mutationFn: () => api.patch(`/time-entries/${runningEntry?.id}/resume`),
    onMutate: () => setOptimisticState('running'),
    onSuccess: invalidate,
    onError: () => setOptimisticState(null),
  })

  const { data: projectTasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    queryFn: () => api.get(`/projects/${projectId}/tasks`).then(r => r.data),
    enabled: !!projectId,
  })

  const isBusy = startMutation.isPending || stopMutation.isPending || pauseMutation.isPending || resumeMutation.isPending
  const activeProject = projects.find(p => p.id === projectId)
  const activeTask = projectTasks.find(t => t.id === taskId)
  const canStart = !!projectId

  return (
    <div className="card flex flex-col gap-3 px-4 py-3.5 mb-7 md:flex-row md:items-center">
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <input
          className="min-h-10 w-full flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30"
          placeholder={isListening ? 'Listening…' : 'What are you working on?'}
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !isActive && canStart && startMutation.mutate()}
          disabled={isActive}
        />
        {speechSupported && !isActive && (
          <button
            type="button"
            title={isListening ? 'Stop listening' : 'Speak to fill description'}
            onClick={toggleSpeech}
            className={cn(
              'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border transition-all',
              isListening
                ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                : 'bg-white/5 border-white/10 text-white/30 hover:border-white/20 hover:text-white/60'
            )}
          >
            {isListening ? <MicOff size={13} /> : <Mic size={13} />}
          </button>
        )}
      </div>

      {/* Project picker */}
      <div className="relative w-full md:w-auto" ref={projectPickerRef}>
        <button
          type="button"
          aria-expanded={showProjects}
          aria-haspopup="listbox"
          className={cn(
            'flex min-h-9 w-full items-center justify-center gap-1.5 truncate rounded-lg border px-2.5 py-1.5 text-xs transition-all focus-ring md:w-auto md:max-w-[180px]',
            activeProject
              ? 'border-[color:var(--border)] bg-[rgb(var(--accent)_/_0.04)] text-[rgb(var(--text-muted))] hover:border-[color:var(--border-strong)] hover:text-[rgb(var(--text-base))]'
              : 'border-orange-500/45 bg-orange-500/5 text-[rgb(var(--text-muted))] hover:border-orange-500/70 hover:text-[rgb(var(--text-base))]'
          )}
          onClick={() => !isActive && setShowProjects(v => !v)}
          onKeyDown={e => {
            if (e.key === 'Escape') setShowProjects(false)
          }}
        >
          {activeProject
            ? <><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: activeProject.color }} /><span className="truncate">{activeProject.name}</span></>
            : <><Folder size={11} /><span>Project <span className="text-orange-400">*</span></span></>}
        </button>
        {showProjects && (
          <div
            className="absolute left-0 top-full z-30 mt-2 w-full min-w-64 rounded-xl border border-[color:var(--border-strong)] bg-[rgb(var(--bg-card))] p-1.5 shadow-[var(--shadow-lg)] md:w-64"
            role="listbox"
            aria-label="Project"
          >
            <button
              type="button"
              role="option"
              aria-selected={!projectId}
              className="flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--accent)_/_0.07)] hover:text-[rgb(var(--text-base))] focus-ring"
              onClick={() => { setProjectId(null); setShowProjects(false) }}
            >
              <span className="truncate">No project</span>
              {!projectId && <Check size={13} className="flex-shrink-0 text-[rgb(var(--accent))]" />}
            </button>
            {projects.map(p => (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={p.id === projectId}
                className={cn(
                  'flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm transition-colors focus-ring',
                  p.id === projectId
                    ? 'bg-[rgb(var(--accent)_/_0.12)] text-[rgb(var(--accent))]'
                    : 'text-[rgb(var(--text-base))] hover:bg-[rgb(var(--accent)_/_0.07)]'
                )}
                onClick={() => { setProjectId(p.id); setShowProjects(false) }}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: p.color }} />
                  <span className="truncate">{p.name}</span>
                </span>
                {p.id === projectId && <Check size={13} className="flex-shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task picker — only visible when a project is selected */}
      {projectId && projectTasks.length > 0 && (
        <div className="relative w-full md:w-auto">
          <select
            className={cn(
              'flex min-h-9 w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all md:w-auto md:max-w-[200px]',
              'appearance-none -webkit-appearance-none cursor-pointer outline-none',
              taskId
                ? 'border-[color:var(--border)] bg-[rgb(var(--accent)_/_0.04)] text-[rgb(var(--text-muted))]'
                : 'border-[color:var(--border)] bg-white/[0.03] text-[rgb(var(--text-faint))]'
            )}
            value={taskId ?? ''}
            disabled={isActive}
            onChange={e => setTaskId(e.target.value || null)}
          >
            <option value="">No task</option>
            {projectTasks.map(t => (
              <option key={t.id} value={t.id}>
                #{t.id.slice(0, 7)} · {t.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tag */}
      <TagInput value={tag} onSelect={setTag} />

      {/* Billable toggle */}
      <button
        title={billable ? 'Billable' : 'Non-billable'}
        onClick={() => !isRunning && setBillable(v => !v)}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg border transition-all flex-shrink-0',
          billable
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            : 'bg-white/5 border-white/10 text-white/30 hover:border-white/20'
        )}
      >
        <DollarSign size={13} />
      </button>

      <div className="hidden w-px h-6 bg-white/[0.07] md:block" />

      {/* Elapsed time */}
      <span className={cn(
        'w-full font-mono text-xl font-medium text-center tabular-nums md:w-auto md:min-w-[90px] md:text-right',
        isRunning ? 'text-accent-green' : isPaused ? 'text-yellow-400' : 'text-white/60'
      )}>
        {formatSeconds(elapsed)}
        {isPaused && <span className="ml-1.5 text-[10px] font-sans text-yellow-400/70 align-middle">paused</span>}
      </span>

      {/* Controls */}
      <div className="flex gap-2 w-full md:w-auto">
        {/* Pause / Resume */}
        {isActive && (
          <button
            onClick={() => isPaused ? resumeMutation.mutate() : pauseMutation.mutate()}
            disabled={isBusy}
            title={isPaused ? 'Resume' : 'Pause'}
            className="flex-1 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:brightness-110 active:scale-95 bg-yellow-500/20 border border-yellow-500/30 md:flex-none md:w-10"
          >
            {pauseMutation.isPending || resumeMutation.isPending
              ? <Loader2 size={13} className="text-yellow-400 animate-spin" />
              : isPaused
                ? <Play size={13} fill="currentColor" className="text-yellow-400 ml-0.5" />
                : <Pause size={13} fill="currentColor" className="text-yellow-400" />}
          </button>
        )}

        {/* Start / Stop */}
        <button
          onClick={() => isActive ? stopMutation.mutate() : startMutation.mutate()}
          disabled={isBusy || (!isActive && !canStart)}
          title={!isActive && !canStart ? 'Select a project first' : undefined}
          className={cn(
            'flex-1 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 md:flex-none md:w-10',
            isActive
              ? 'bg-accent-red hover:brightness-110'
              : canStart
                ? 'bg-accent-green hover:brightness-110'
                : 'bg-white/10 cursor-not-allowed opacity-50'
          )}
        >
          {startMutation.isPending || stopMutation.isPending
            ? <Loader2 size={14} className="text-white animate-spin" />
            : isActive
              ? <Square size={14} fill="white" className="text-white" />
              : <Play size={14} fill="white" className="text-white ml-0.5" />}
        </button>
      </div>
    </div>
  )
}
