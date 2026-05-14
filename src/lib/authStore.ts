import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Role } from '@/types'

export interface AuthUser {
  id: string
  name: string
  email: string
  workspace: string
  dailyHoursGoal: number
  role: Role
  avatarUrl?: string | null
  activeOrgId?: string | null
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (isLoading: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        set({ user: null, isLoading: false })
      },
    }),
    {
      name: 'trackflow-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
