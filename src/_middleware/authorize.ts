// src/_middleware/authorize.ts

import type { Response, NextFunction, RequestHandler } from 'express';
import { verifyToken } from '../_helpers/jwt';
import type { AuthenticatedRequest } from '../types';
import { Role } from '../_helpers/role';

/**
 * Returns an Express middleware that:
 *  1. Requires a valid `Authorization: Bearer <token>` header.
 *  2. Optionally restricts access to one or more roles.
 *
 * @example
 * router.get('/', authorize(), getAll);                  // any authenticated user
 * router.delete('/:id', authorize(Role.Admin), _delete); // admin only
 */
export function authorize(...roles: Role[]): RequestHandler {
  return (req, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized – missing token' });
      return;
    }

    const token = authHeader.slice(7); // strip "Bearer "

    try {
      const payload = verifyToken(token);
      (req as AuthenticatedRequest).user = payload;

      // Role check (only when specific roles are required)
      if (roles.length > 0 && !roles.includes(payload.role as Role)) {
        res.status(403).json({ message: 'Forbidden – insufficient role' });
        return;
      }

      next();
    } catch (err) {
      next(err); // forward to errorHandler (will translate to 401)
    }
  };
}
