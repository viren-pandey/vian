import { create } from 'zustand'
import type { ModelId } from '@/lib/constants'

export interface FileNode {
  path: string
  content: string
  language: string
  status: 'queued' | 'generating' | 'complete' | 'error'
}

export interface ProjectStore {
  // Project
  projectId: string | null
  projectName: string

  // Files
  files: Record<string, FileNode>
  activeFile: string | null

  // UI State
  isGenerating: boolean
  previewUrl: string | null
  model: ModelId
  errorMessage: string | null

  // Actions
  setProjectId: (id: string) => void
  setProjectName: (name: string) => void
  setFile: (path: string, node: Partial<FileNode> & { path: string }) => void
  setActiveFile: (path: string | null) => void
  setIsGenerating: (val: boolean) => void
  setPreviewUrl: (url: string | null) => void
  setModel: (model: ModelId) => void
  setErrorMessage: (msg: string | null) => void
  reset: () => void
}

const INITIAL_STATE = {
  projectId: null,
  projectName: '',
  files: {},
  activeFile: null,
  isGenerating: false,
  previewUrl: null,
  model: 'llama-3.3-70b-versatile' as ModelId,
  errorMessage: null,
}

export const useProjectStore = create<ProjectStore>((set) => ({
  ...INITIAL_STATE,

  setProjectId: (id) => set({ projectId: id }),

  setProjectName: (name) => set({ projectName: name }),

  setFile: (path, node) =>
    set((state) => {
      const merged: FileNode = Object.assign(
        {
          path,
          content: '',
          language: langFromPath(path),
          status: 'queued' as FileNode['status'],
        },
        state.files[path] ?? {},
        node,
      )
      // Always ensure content is a string to prevent Monaco crashes
      if (typeof merged.content !== 'string') {
        merged.content = merged.content != null ? String(merged.content) : ''
      }
      return { files: { ...state.files, [path]: merged } }
    }),

  setActiveFile: (path) => set({ activeFile: path }),

  setIsGenerating: (val) => set({ isGenerating: val }),

  setPreviewUrl: (url) => set({ previewUrl: url }),

  setModel: (model) => set({ model }),

  setErrorMessage: (msg) => set({ errorMessage: msg }),

  reset: () => set(INITIAL_STATE),
}))

function langFromPath(path: string): string {
  const ext = path.split('.').pop() ?? ''
  const map: Record<string, string> = {
    tsx: 'typescript', ts: 'typescript',
    jsx: 'javascript', js: 'javascript',
    json: 'json', css: 'css',
    md: 'markdown', html: 'html',
    prisma: 'graphql', yaml: 'yaml', yml: 'yaml',
  }
  return map[ext] ?? 'plaintext'
}
