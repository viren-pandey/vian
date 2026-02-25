import { create } from 'zustand'

type Theme = 'dark'
type SidebarSection = 'explorer' | 'history' | 'settings'

interface AppStore {
  theme: Theme
  sidebarSection: SidebarSection
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean

  setSidebarSection: (s: SidebarSection) => void
  setSidebarCollapsed: (v: boolean) => void
  toggleSidebar: () => void
  setCommandPaletteOpen: (v: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  theme: 'dark',
  sidebarSection: 'explorer',
  sidebarCollapsed: false,
  commandPaletteOpen: false,

  setSidebarSection: (sidebarSection) => set({ sidebarSection }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
}))
