import axios from 'axios'
import type {
  GenerationRequest,
  GenerationResponse,
  EditRequest,
  EditResponse,
  ExportRequest,
  Project,
} from '@vian/shared-types'

const api = axios.create({
  baseURL: '/api',   // Next.js rewrites proxy this to Express on :4000
  timeout: 120_000,  // 2 min for generation (LLMs can be slow)
})

export async function generateProject(req: GenerationRequest): Promise<GenerationResponse> {
  const { data } = await api.post<GenerationResponse>('/generate', req)
  return data
}

export async function editFileAPI(req: EditRequest): Promise<EditResponse> {
  const { data } = await api.post<EditResponse>('/edit', req)
  return data
}

export async function exportProject(req: ExportRequest): Promise<Blob> {
  const { data } = await api.post('/export', req, { responseType: 'blob' })
  return data
}

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>('/projects')
  return data
}

export async function saveProject(project: Project): Promise<Project> {
  const { data } = await api.post<Project>('/projects', project)
  return data
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`)
}
