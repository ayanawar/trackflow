'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Square, Pause, Folder, DollarSign, Mic, MicOff } from 'lucide-react'
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
  const [billable, setBillable] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [showProjects, setShowProjects] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    setSpeechSupported(
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    )
  }, [])

  const toggleSpeech = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const SR = (window as typeof window & { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition ?? window.SpeechRecognition
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setDescription(prev => prev ? `${prev} ${transcript}` : transcript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isListening])

  const isRunning = !!runningEntry && runningEntry.isRunning
  const isPaused = !!runningEntry && runningEntry.isPaused
  const isActive = isRunning || isPaused

  useEffect(() => {
    if (runningEntry) {
      setDescription(runningEntry.description ?? '')
      setProjectId(runningEntry.projectId)
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
    qc.invalidateQueries({ queryKey: ['stats'] })
  }

  const startMutation = useMutation({
    mutationFn: () => api.post('/time-entries', {
      description, projectId, tag: tag || null, billable,
      startTime: new Date().toISOString(),
    }),
    onSuccess: invalidate,
  })

  const stopMutation = useMutation({
    mutationFn: () => api.patch(`/time-entries/${runningEntry?.id}/stop`, { endTime: new Date().toISOString() }),
    onSuccess: () => {
      invalidate()
      setDescription(''); setProjectId(null); setTag(''); setBillable(false)
    },
  })

  const pauseMutation = useMutation({
    mutationFn: () => api.patch(`/time-entries/${runningEntry?.id}/pause`),
    onSuccess: invalidate,
  })

  const resumeMutation = useMutation({
    mutationFn: () => api.patch(`/time-entries/${runningEntry?.id}/resume`),
    onSuccess: invalidate,
  })

  const isBusy = startMutation.isPending || stopMutation.isPending || pauseMutation.isPending || resumeMutation.isPending
  const activeProject = projects.find(p => p.id === projectId)

  return (
    <div className="card flex flex-col gap-3 px-4 py-3.5 mb-7 md:flex-row md:items-center">
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <input
          className="min-h-10 w-full flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30"
          placeholder={isListening ? 'Listening…' : 'What are you working on?'}
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !isActive && startMutation.mutate()}
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
      <div className="relative w-full md:w-auto">
        <button
          className="flex min-h-9 w-full items-center justify-center gap-1.5 truncate px-2.5 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 border border-white/10 hover:border-white/20 transition-all md:w-auto"
          onClick={() => !isActive && setShowProjects(v => !v)}
        >
          {activeProject
            ? <><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: activeProject.color }} /><span className="truncate">{activeProject.name}</span></>
            : <><Folder size={11} />Project</>}
        </button>
        {showProjects && (
          <div className="absolute top-full left-0 mt-1 w-full min-w-48 bg-[rgb(var(--bg-secondary))] border border-white/10 rounded-xl p-1 z-30 shadow-xl md:w-48">
            <button className="w-full text-left text-xs px-3 py-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white" onClick={() => { setProjectId(null); setShowProjects(false) }}>No project</button>
            {projects.map(p => (
              <button key={p.id} className="w-full text-left text-xs px-3 py-2 rounded-lg text-white hover:bg-white/5 flex items-center gap-2" onClick={() => { setProjectId(p.id); setShowProjects(false) }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} /><span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

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
            {isPaused
              ? <Play size={13} fill="currentColor" className="text-yellow-400 ml-0.5" />
              : <Pause size={13} fill="currentColor" className="text-yellow-400" />}
          </button>
        )}

        {/* Start / Stop */}
        <button
          onClick={() => isActive ? stopMutation.mutate() : startMutation.mutate()}
          disabled={isBusy}
          className={cn(
            'flex-1 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:brightness-110 active:scale-95 md:flex-none md:w-10',
            isActive ? 'bg-accent-red' : 'bg-accent-green'
          )}
        >
          {isActive
            ? <Square size={14} fill="white" className="text-white" />
            : <Play size={14} fill="white" className="text-white ml-0.5" />}
        </button>
      </div>
    </div>
  )
}
