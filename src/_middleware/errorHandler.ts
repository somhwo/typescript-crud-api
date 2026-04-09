// src/_middleware/errorHandler.ts

import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error | string | unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (typeof err === 'string') {
    const is404 = err.toLowerCase().endsWith('not found');
    const is401 = err.toLowerCase().includes('unauthorized');
    res.status(is404 ? 404 : is401 ? 401 : 400).json({ message: err });
    return;
  }

  if (err instanceof Error) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      res.status(401).json({ message: err.message });
      return;
    }
    res.status(500).json({ message: err.message });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
}
