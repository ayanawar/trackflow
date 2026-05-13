'use client'
import { useState, useRef, useEffect } from 'react'
import { Tag, X } from 'lucide-react'
import { useTags } from '@/hooks/useTags'

interface Props {
  value: string
  onSelect: (tag: string) => void
}

export default function TagInput({ value, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: tags = [] } = useTags()

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setInput('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const handleSelect = (tag: string) => {
    onSelect(tag)
    setOpen(false)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      handleSelect(input.trim())
    } else if (e.key === 'Escape') {
      setOpen(false)
      setInput('')
    }
  }

  const filteredTags = tags.filter(t =>
    !input || t.name.toLowerCase().includes(input.toLowerCase())
  )

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 border border-white/10 hover:border-white/20 transition-all"
        onClick={() => setOpen(v => !v)}
      >
        <Tag size={11} />
        {value || 'Tag'}
        {value && (
          <span
            className="ml-0.5 text-white/30 hover:text-white/60"
            onClick={e => { e.stopPropagation(); onSelect('') }}
          >
            <X size={9} />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-[rgb(var(--bg-secondary))] border border-white/10 rounded-xl p-2 z-30 shadow-xl">
          <input
            ref={inputRef}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/25 mb-2"
            placeholder="Type a tag name…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {filteredTags.length > 0 && (
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {filteredTags.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                  onClick={() => handleSelect(t.name)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
          {filteredTags.length === 0 && input && (
            <p className="text-[11px] text-white/30 px-2 pb-1">Press Enter to add &ldquo;{input}&rdquo;</p>
          )}
        </div>
      )}
    </div>
  )
}
