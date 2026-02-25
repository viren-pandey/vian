import { Request, Response, NextFunction } from 'express'

/**
 * Placeholder auth middleware.
 * Replace with real JWT / Clerk / NextAuth validation in production.
 */
export function auth(_req: Request, _res: Response, next: NextFunction) {
  // TODO: validate Bearer token here
  next()
}
