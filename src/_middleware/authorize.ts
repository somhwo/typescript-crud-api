// src/_middleware/authorize.ts

import type { Response, NextFunction, RequestHandler } from 'express';
import { verifyToken } from '../_helpers/jwt';
import type { AuthenticatedRequest } from '../types';
import { Role } from '../_helpers/role';

export function authorize(...roles: Role[]): RequestHandler {
  return (req, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized – missing token' });
      return;
    }

    try {
      const payload = verifyToken(authHeader.slice(7));
      (req as unknown as AuthenticatedRequest).user = payload;

      if (roles.length > 0 && !roles.includes(payload.role as Role)) {
        res.status(403).json({ message: 'Forbidden – insufficient role' });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
