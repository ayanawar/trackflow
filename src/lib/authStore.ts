import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Role } from '@/types'

export interface AuthUser {
  id: string
  name: string
  email: string
  dailyHoursGoal: number
  role: Role
  avatarUrl?: string | null
  activeOrgId?: string | null
  activeWorkspaceId?: string | null
}

interface AuthState {
  user: AuthUser | null
  activeWorkspaceId: string | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setActiveWorkspace: (workspaceId: string | null) => void
  setLoading: (isLoading: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      activeWorkspaceId: null,
      isLoading: true,
      setUser: (user) =>
        set({
          user,
          activeWorkspaceId: user?.activeWorkspaceId ?? null,
          isLoading: false,
        }),
      setActiveWorkspace: (workspaceId) =>
        set(state => ({
          activeWorkspaceId: workspaceId,
          user: state.user ? { ...state.user, activeWorkspaceId: workspaceId } : state.user,
        })),
      setLoading: (isLoading) => set({ isLoading }),
      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        set({ user: null, activeWorkspaceId: null, isLoading: false })
      },
    }),
    {
      name: 'trackflow-auth',
      partialize: (state) => ({ user: state.user, activeWorkspaceId: state.activeWorkspaceId }),
    }
  )
)
