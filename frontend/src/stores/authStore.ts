import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { type AuthUser } from '../features/auth/types'
import { useAppointmentsFilterStore } from './appointmentsFilterStore'

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  accessTokenExpiresAt: number | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  setSession: (user: AuthUser, accessToken: string, expiresIn: number) => void
  setAccessToken: (accessToken: string, expiresIn: number) => void
  setUser: (user: AuthUser) => void
  clearSession: () => void
  setBootstrapped: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      accessTokenExpiresAt: null,
      isAuthenticated: false,
      isBootstrapping: true,
      setSession: (user, accessToken, expiresIn) =>
        set({
          user,
          accessToken,
          accessTokenExpiresAt: Date.now() + expiresIn * 1000,
          isAuthenticated: true,
        }),
      setAccessToken: (accessToken, expiresIn) =>
        set({ accessToken, accessTokenExpiresAt: Date.now() + expiresIn * 1000 }),
      setUser: (user) => set({ user }),
      clearSession: () => {
        set({ user: null, accessToken: null, accessTokenExpiresAt: null, isAuthenticated: false })
        useAppointmentsFilterStore.getState().reset()
        useAppointmentsFilterStore.getState().setRestoreOnReturn(false)
      },
      setBootstrapped: () => set({ isBootstrapping: false }),
    }),
    {
      name: 'docsy_auth',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    },
  ),
)
