'use client'
import { useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useThemeStore, applyTheme } from '@/lib/themeStore'
import { cn } from '@/lib/utils'

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useThemeStore()

  // Apply persisted theme on mount
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const isDark = theme === 'dark'

  if (compact) {
    return (
      <button
        onClick={toggle}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90',
          'border hover:scale-110',
          isDark
            ? 'bg-white/5 border-white/10 text-white/50 hover:text-amber-400 hover:border-amber-400/30'
            : 'bg-black/5 border-black/10 text-slate-500 hover:text-amber-500 hover:border-amber-400/40'
        )}
      >
        {isDark
          ? <Sun size={14} className="transition-transform duration-300" />
          : <Moon size={14} className="transition-transform duration-300" />
        }
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
        isDark
          ? 'text-white/50 hover:bg-white/5 hover:text-white'
          : 'text-slate-500 hover:bg-black/5 hover:text-slate-800'
      )}
    >
      <div className={cn(
        'relative w-8 h-4.5 rounded-full transition-all duration-300 flex-shrink-0',
        isDark ? 'bg-white/10' : 'bg-indigo-100 border border-indigo-200'
      )}>
        <div className={cn(
          'absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 shadow-sm',
          isDark
            ? 'left-0.5 bg-white/40'
            : 'left-[18px] bg-indigo-500'
        )} />
      </div>
      <span>{isDark ? 'Dark mode' : 'Light mode'}</span>
      {isDark ? <Moon size={13} className="ml-auto opacity-50" /> : <Sun size={13} className="ml-auto text-amber-500" />}
    </button>
  )
}
