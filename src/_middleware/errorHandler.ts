// src/_middleware/errorHandler.ts

import type { Request, Response, NextFunction } from 'express';

/**
 * Central Express error handler.
 *
 * Convention:
 *  - String errors  → application-level messages (400 or 404).
 *  - Error objects  → unexpected runtime errors (500).
 */
export function errorHandler(
  err: Error | string | unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (typeof err === 'string') {
    const is404     = err.toLowerCase().endsWith('not found');
    const is401     = err.toLowerCase().includes('unauthorized');
    const statusCode = is404 ? 404 : is401 ? 401 : 400;
    res.status(statusCode).json({ message: err });
    return;
  }

  if (err instanceof Error) {
    // Propagate specific JWT errors as 401
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      res.status(401).json({ message: err.message });
      return;
    }
    res.status(500).json({ message: err.message });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
}
