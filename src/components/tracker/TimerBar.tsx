'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play, Square, Pause, Folder, DollarSign, Mic, MicOff,
  Check, Loader2, Clock, Coffee, List, MoreVertical,
} from 'lucide-react'
import TagInput from '@/components/tracker/TagInput'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/apiClient'
import { formatSeconds, cn } from '@/lib/utils'
import type { Project, TimeEntry, Task } from '@/types'

type TrackerMode = 'timer' | 'manual' | 'break'

interface Props {
  projects: Project[]
  runningEntry?: TimeEntry | null
}

const MODES: { key: TrackerMode; label: string; Icon: typeof Clock }[] = [
  { key: 'timer',  label: 'Timer Mode',  Icon: Clock },
  { key: 'manual', label: 'Manual Mode', Icon: List },
  { key: 'break',  label: 'Break Mode',  Icon: Coffee },
]

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
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
  const [mode, setMode] = useState<TrackerMode>('timer')
  const [showModeMenu, setShowModeMenu] = useState(false)
  const [manualStart, setManualStart] = useState(() => toDatetimeLocal(new Date()))
  const [manualEnd, setManualEnd] = useState(() => toDatetimeLocal(new Date()))
  const [optimisticState, setOptimisticState] = useState<'running' | 'paused' | 'stopped' | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const projectPickerRef = useRef<HTMLDivElement>(null)
  const modeMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSpeechSupported(
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    )
  }, [])

  useEffect(() => {
    if (!showProjects) return
    const handler = (e: MouseEvent) => {
      if (!projectPickerRef.current?.contains(e.target as Node)) setShowProjects(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showProjects])

  useEffect(() => {
    if (!showModeMenu) return
    const handler = (e: MouseEvent) => {
      if (!modeMenuRef.current?.contains(e.target as Node)) setShowModeMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showModeMenu])

  const toggleSpeech = useCallback(() => {
    if (isListening) { recognitionRef.current?.stop(); return }
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

  useEffect(() => {
    if (optimisticState === null) return
    if (optimisticState === 'running' && _isRunning)                setOptimisticState(null)
    if (optimisticState === 'paused'  && _isPaused)                 setOptimisticState(null)
    if (optimisticState === 'stopped' && !_isRunning && !_isPaused) setOptimisticState(null)
  }, [_isRunning, _isPaused, optimisticState])

  const isRunning = optimisticState === 'running' || (optimisticState === null && _isRunning)
  const isPaused  = optimisticState === 'paused'  || (optimisticState === null && _isPaused)
  const isActive  = optimisticState === 'stopped' ? false
                  : optimisticState !== null       ? true
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

  const resetFields = () => {
    setDescription('')
    setProjectId(null)
    setTaskId(null)
    setTag('')
    setBillable(false)
  }

  const startMutation = useMutation({
    mutationFn: () => api.post('/time-entries', {
      description: mode === 'break' ? (description || 'Break') : description,
      projectId, taskId: taskId || null, tag: tag || null, billable,
      startTime: new Date().toISOString(),
    }),
    onMutate: () => setOptimisticState('running'),
    onSuccess: invalidate,
    onError: () => setOptimisticState(null),
  })

  const stopMutation = useMutation({
    mutationFn: () => api.patch(`/time-entries/${runningEntry?.id}/stop`, { endTime: new Date().toISOString() }),
    onMutate: () => setOptimisticState('stopped'),
    onSuccess: () => { invalidate(); resetFields() },
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

  const addManualMutation = useMutation({
    mutationFn: () => {
      const start = new Date(manualStart)
      const end = new Date(manualEnd)
      if (end <= start) end.setDate(end.getDate() + 1)
      return api.post('/time-entries', {
        description,
        projectId,
        taskId: taskId || null,
        tag: tag || null,
        billable,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      })
    },
    onSuccess: () => {
      invalidate()
      resetFields()
      const now = new Date()
      setManualStart(toDatetimeLocal(now))
      setManualEnd(toDatetimeLocal(now))
    },
  })

  const { data: projectTasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    queryFn: () => api.get(`/projects/${projectId}/tasks`).then(r => r.data),
    enabled: !!projectId,
  })

  const isBusy = startMutation.isPending || stopMutation.isPending || pauseMutation.isPending || resumeMutation.isPending || addManualMutation.isPending
  const activeProject = projects.find(p => p.id === projectId)

  const manualDuration = (() => {
    try {
      const diff = Math.floor((new Date(manualEnd).getTime() - new Date(manualStart).getTime()) / 1000)
      return diff > 0 ? diff : diff + 86400
    } catch { return 0 }
  })()

  const canStartTimer = mode === 'break' ? true : !!projectId
  const canAddManual = manualDuration > 0

  const handleModeChange = (next: TrackerMode) => {
    if (isActive) return
    if (next === 'break' && mode !== 'break') setDescription('Break')
    else if (next !== 'break' && mode === 'break') setDescription('')
    setMode(next)
    setShowModeMenu(false)
  }

  const isBreak  = mode === 'break'
  const isManual = mode === 'manual'

  return (
    <div className={cn(
      'card flex flex-col gap-3 px-4 py-3.5 mb-7 md:flex-row md:items-center',
      isBreak && 'border-orange-500/20'
    )}>
      {/* Description */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        {isBreak && <Coffee size={14} className="text-orange-400 flex-shrink-0" />}
        <input
          className="min-h-10 w-full flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30"
          placeholder={
            isListening ? 'Listening…'
            : isBreak   ? 'Break description (optional)'
            : 'What are you working on?'
          }
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !isManual && !isActive && canStartTimer) startMutation.mutate()
          }}
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
          onKeyDown={e => { if (e.key === 'Escape') setShowProjects(false) }}
        >
          {activeProject
            ? <><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: activeProject.color }} /><span className="truncate">{activeProject.name}</span></>
            : <><Folder size={11} /><span>Project{!isBreak && !isManual && <span className="text-orange-400 ml-0.5">*</span>}</span></>}
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

      {/* Task picker */}
      {projectId && projectTasks.length > 0 && (
        <div className="relative w-full md:w-auto">
          <select
            className={cn(
              'flex min-h-9 w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all md:w-auto md:max-w-[200px]',
              'appearance-none cursor-pointer outline-none',
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
              <option key={t.id} value={t.id}>#{t.id.slice(0, 7)} · {t.title}</option>
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

      {/* Manual mode: datetime inputs */}
      {isManual ? (
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <input
            type="datetime-local"
            value={manualStart}
            onChange={e => setManualStart(e.target.value)}
            className="h-9 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-white/70 outline-none focus:border-[rgb(var(--accent)_/_0.4)] focus:text-white transition-colors"
          />
          <span className="text-white/30 text-xs">–</span>
          <input
            type="datetime-local"
            value={manualEnd}
            onChange={e => setManualEnd(e.target.value)}
            className="h-9 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-white/70 outline-none focus:border-[rgb(var(--accent)_/_0.4)] focus:text-white transition-colors"
          />
          {canAddManual && (
            <span className="font-mono text-sm text-white/40 min-w-[56px] text-right hidden md:inline">
              {formatSeconds(manualDuration)}
            </span>
          )}
        </div>
      ) : (
        /* Elapsed timer */
        <span className={cn(
          'w-full font-mono text-xl font-medium text-center tabular-nums md:w-auto md:min-w-[90px] md:text-right',
          isRunning
            ? isBreak ? 'text-orange-400' : 'text-accent-green'
            : isPaused ? 'text-yellow-400'
            : 'text-white/60'
        )}>
          {formatSeconds(elapsed)}
          {isPaused && <span className="ml-1.5 text-[10px] font-sans text-yellow-400/70 align-middle">paused</span>}
        </span>
      )}

      {/* Controls */}
      <div className="flex gap-2 w-full md:w-auto items-center">
        {isManual ? (
          /* ADD button */
          <button
            onClick={() => addManualMutation.mutate()}
            disabled={isBusy || !canAddManual}
            className={cn(
              'flex-1 h-10 rounded-full flex items-center justify-center gap-2 px-6 flex-shrink-0 transition-all active:scale-95 text-sm font-bold text-white md:flex-none',
              canAddManual
                ? 'bg-[rgb(var(--accent))] hover:brightness-110'
                : 'bg-white/10 cursor-not-allowed opacity-50'
            )}
          >
            {addManualMutation.isPending
              ? <Loader2 size={14} className="animate-spin" />
              : 'ADD'
            }
          </button>
        ) : (
          <>
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
              disabled={isBusy || (!isActive && !canStartTimer)}
              title={!isActive && !canStartTimer ? 'Select a project first' : undefined}
              className={cn(
                'flex-1 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 md:flex-none md:w-10',
                isActive
                  ? 'bg-accent-red hover:brightness-110'
                  : canStartTimer
                    ? isBreak
                      ? 'bg-orange-500 hover:brightness-110'
                      : 'bg-accent-green hover:brightness-110'
                    : 'bg-white/10 cursor-not-allowed opacity-50'
              )}
            >
              {startMutation.isPending || stopMutation.isPending
                ? <Loader2 size={14} className="text-white animate-spin" />
                : isActive
                  ? <Square size={14} fill="white" className="text-white" />
                  : <Play size={14} fill="white" className="text-white ml-0.5" />}
            </button>
          </>
        )}

        {/* Mode menu */}
        <div className="relative flex-shrink-0" ref={modeMenuRef}>
          <button
            type="button"
            onClick={() => !isActive && setShowModeMenu(v => !v)}
            disabled={isActive}
            title="Switch tracking mode"
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center border transition-all',
              'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/70',
              isActive && 'opacity-30 cursor-not-allowed'
            )}
          >
            <MoreVertical size={14} />
          </button>

          {showModeMenu && (
            <div className="absolute right-0 top-full z-40 mt-2 w-52 rounded-xl border border-[color:var(--border-strong)] bg-[rgb(var(--bg-card))] p-1.5 shadow-[var(--shadow-lg)]">
              {MODES.map(({ key, label, Icon }) => {
                const active = mode === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleModeChange(key)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      active
                        ? 'bg-[rgb(var(--accent)_/_0.12)] text-[rgb(var(--accent))]'
                        : 'text-[rgb(var(--text-base))] hover:bg-[rgb(var(--accent)_/_0.07)]'
                    )}
                  >
                    <Icon size={15} className={active ? 'text-[rgb(var(--accent))]' : 'text-white/40'} />
                    <span className="text-sm font-medium">{label}</span>
                    {active && <Check size={13} className="ml-auto flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
