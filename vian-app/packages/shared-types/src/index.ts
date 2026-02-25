// ─── Generation ───────────────────────────────────────────────────────────────

export interface GenerationRequest {
  prompt: string
  model: 'gpt-4o' | 'gpt-4-turbo' | 'claude-3-5-sonnet' | 'claude-3-opus'
  projectName?: string
  sessionId?: string
}

export interface GenerationResponse {
  sessionId: string
  projectId: string
  status: 'streaming' | 'complete' | 'error'
  files: GeneratedFile[]
  error?: string
}

// ─── Files ────────────────────────────────────────────────────────────────────

export interface GeneratedFile {
  path: string
  name: string
  content: string
  language: string
  isDirectory: boolean
}

export interface FileNode {
  path: string
  name: string
  isDirectory: boolean
  children?: FileNode[]
  status?: 'pending' | 'generating' | 'complete' | 'error'
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  prompt: string
  model: string
  files: GeneratedFile[]
  createdAt: Date
  updatedAt: Date
  userId?: string
}

// ─── Edit ─────────────────────────────────────────────────────────────────────

export interface EditRequest {
  projectId: string
  fileToEdit: string
  instruction: string
  model: 'gpt-4o' | 'claude-3-5-sonnet'
  currentContent: string
}

export interface EditResponse {
  updatedContent: string
  explanation: string
}

// ─── Streaming ────────────────────────────────────────────────────────────────

export interface StreamChunk {
  type: 'file_start' | 'file_content' | 'file_end' | 'done' | 'error'
  filePath?: string
  content?: string
  error?: string
}

// ─── Export ───────────────────────────────────────────────────────────────────

export interface ExportRequest {
  projectId: string
  format: 'zip' | 'github'
}
