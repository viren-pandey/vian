import { Router, type IRouter } from 'express'
import type { Project } from '@vian/shared-types'

export const projectsRouter: IRouter = Router()

// In-memory store — replace with Prisma for persistence
const projects = new Map<string, Project>()

projectsRouter.get('/', (_req, res) => {
  res.json(Array.from(projects.values()))
})

projectsRouter.get('/:id', (req, res) => {
  const project = projects.get(req.params.id)
  if (!project) return res.status(404).json({ error: 'Project not found' })
  return res.json(project)
})

projectsRouter.post('/', (req, res) => {
  const project: Project = {
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  projects.set(project.id, project)
  return res.status(201).json(project)
})

projectsRouter.put('/:id', (req, res) => {
  const existing = projects.get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Project not found' })
  const updated: Project = { ...existing, ...req.body, updatedAt: new Date() }
  projects.set(req.params.id, updated)
  return res.json(updated)
})

projectsRouter.delete('/:id', (req, res) => {
  projects.delete(req.params.id)
  return res.status(204).send()
})
