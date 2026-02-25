import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  accessKey?: string
}

interface AuthStore {
  user: AuthUser | null
  token: string | null
  isLoading: boolean

  setUser: (user: AuthUser | null) => void
  setToken: (token: string | null) => void
  setIsLoading: (val: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setIsLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, token: null }),
}))
