import { Router, type IRouter, Request, Response, NextFunction } from 'express'
import archiver from 'archiver'
import type { GeneratedFile } from '@vian/shared-types'

export const exportRouter: IRouter = Router()

interface ExportBody {
  files: GeneratedFile[]
  projectName: string
}

exportRouter.post(
  '/',
  (
    req: Request<Record<string, never>, unknown, ExportBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { files, projectName = 'vian-project' } = req.body

      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: 'files array is required' })
      }

      res.setHeader('Content-Type', 'application/zip')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${projectName}.zip"`
      )

      const archive = archiver('zip', { zlib: { level: 6 } })
      archive.on('error', next)
      archive.pipe(res)

      for (const file of files) {
        if (!file.isDirectory) {
          archive.append(file.content, {
            name: `${projectName}/${file.path}`,
          })
        }
      }

      archive.finalize()
    } catch (err) {
      next(err)
    }
  }
)
