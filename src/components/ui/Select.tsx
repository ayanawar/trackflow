'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Option<T extends string = string> {
  value: T
  label: string
}

interface Props<T extends string = string> {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  className?: string
}

export default function Select<T extends string>({ value, onChange, options, className }: Props<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input flex w-full items-center justify-between gap-2 text-left"
      >
        <span>{selected?.label ?? value}</span>
        <ChevronDown size={14} className={cn('text-white/40 transition-transform flex-shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-white/[0.08] bg-[rgb(var(--bg-secondary))] shadow-xl py-1">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-[13px] transition-colors',
                opt.value === value
                  ? 'bg-accent/10 text-accent'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              )}
            >
              {opt.label}
              {opt.value === value && <Check size={13} className="text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
