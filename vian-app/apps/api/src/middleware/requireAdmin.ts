import { Request, Response, NextFunction } from 'express'

/**
 * Placeholder admin guard.
 * In production: validate JWT, check user.role === 'ULTIMATE_ADMIN'.
 */
export function requireAdmin(_req: Request, _res: Response, next: NextFunction) {
  // TODO: validate admin session / token
  next()
}
