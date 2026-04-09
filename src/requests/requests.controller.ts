// src/requests/requests.controller.ts

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { Role } from '../_helpers/role';
import { authorize } from '../_middleware/authorize';
import { validateRequest } from '../_middleware/validateRequest';
import { requestService } from './request.service';
import type { AuthenticatedRequest, RequestStatus } from '../types';
import { db } from '../_helpers/db';

const router = Router();

// ─── Routes ───────────────────────────────────────────────────────────────────
//  GET    /requests              – Admin: all requests; User: own requests
//  POST   /requests              – authenticated user submits a request
//  PUT    /requests/:id/status   – Admin only: approve or reject
//  DELETE /requests/:id          – Admin only

router.get('/',                authorize(),           getAll);
router.post('/',               authorize(), createSchema, create);
router.put('/:id/status',      authorize(Role.Admin), statusSchema, updateStatus);
router.delete('/:id',          authorize(Role.Admin), _delete);

export default router;

// ─── Handlers ────────────────────────────────────────────────────────────────

async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as unknown as AuthenticatedRequest;

    if (user.role === Role.Admin) {
      // Admin sees everything
      res.json(await requestService.getAll());
    } else {
      // Regular user: look up their email from db, then filter requests
      const account = await db.User.findByPk(user.sub);
      if (!account) { res.status(404).json({ message: 'Account not found' }); return; }
      res.json(await requestService.getByEmail(account.email));
    }
  } catch (err) {
    next(err);
  }
}

async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const account = await db.User.findByPk(user.sub);
    if (!account) { res.status(404).json({ message: 'Account not found' }); return; }

    const request = await requestService.create(
      account.email,
      req.body as Parameters<typeof requestService.create>[1],
    );
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
}

function updateStatus(req: Request, res: Response, next: NextFunction): void {
  requestService
    .updateStatus(Number(req.params.id), (req.body as { status: RequestStatus }).status)
    .then((r) => res.json(r))
    .catch(next);
}

function _delete(req: Request, res: Response, next: NextFunction): void {
  requestService
    .delete(Number(req.params.id))
    .then(() => res.json({ message: 'Request deleted successfully' }))
    .catch(next);
}

// ─── Validation ───────────────────────────────────────────────────────────────

function createSchema(req: Request, _res: Response, next: NextFunction): void {
  validateRequest(req, next, Joi.object({
    type: Joi.string().valid('Equipment', 'Leave', 'Resources').required(),
    items: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        qty:  Joi.number().integer().min(1).default(1),
      }),
    ).min(1).required(),
  }));
}

function statusSchema(req: Request, _res: Response, next: NextFunction): void {
  validateRequest(req, next, Joi.object({
    status: Joi.string().valid('Pending', 'Approved', 'Rejected').required(),
  }));
}
