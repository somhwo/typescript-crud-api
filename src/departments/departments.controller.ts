// src/departments/departments.controller.ts

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { Role } from '../_helpers/role';
import { authorize } from '../_middleware/authorize';
import { validateRequest } from '../_middleware/validateRequest';
import { departmentService } from './department.service';

const router = Router();

// All department routes are Admin-only
router.get('/',    authorize(Role.Admin), getAll);
router.get('/:id', authorize(Role.Admin), getById);
router.post('/',   authorize(Role.Admin), createSchema, create);
router.put('/:id', authorize(Role.Admin), updateSchema, update);
router.delete('/:id', authorize(Role.Admin), _delete);

export default router;

// ─── Handlers ────────────────────────────────────────────────────────────────

function getAll(_req: Request, res: Response, next: NextFunction): void {
  departmentService.getAll().then((d) => res.json(d)).catch(next);
}

function getById(req: Request, res: Response, next: NextFunction): void {
  departmentService.getById(Number(req.params.id)).then((d) => res.json(d)).catch(next);
}

function create(req: Request, res: Response, next: NextFunction): void {
  departmentService.create(req.body as Parameters<typeof departmentService.create>[0])
    .then((d) => res.status(201).json(d))
    .catch(next);
}

function update(req: Request, res: Response, next: NextFunction): void {
  departmentService.update(Number(req.params.id), req.body as Parameters<typeof departmentService.update>[1])
    .then((d) => res.json(d))
    .catch(next);
}

function _delete(req: Request, res: Response, next: NextFunction): void {
  departmentService.delete(Number(req.params.id))
    .then(() => res.json({ message: 'Department deleted successfully' }))
    .catch(next);
}

// ─── Validation ───────────────────────────────────────────────────────────────

function createSchema(req: Request, _res: Response, next: NextFunction): void {
  validateRequest(req, next, Joi.object({
    name:        Joi.string().required(),
    description: Joi.string().allow('').default(''),
  }));
}

function updateSchema(req: Request, _res: Response, next: NextFunction): void {
  validateRequest(req, next, Joi.object({
    name:        Joi.string().empty(''),
    description: Joi.string().allow(''),
  }));
}
