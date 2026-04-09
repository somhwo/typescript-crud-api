// src/employees/employees.controller.ts

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { Role } from '../_helpers/role';
import { authorize } from '../_middleware/authorize';
import { validateRequest } from '../_middleware/validateRequest';
import { employeeService } from './employee.service';

const router = Router();

// All employee routes are Admin-only
router.get('/',    authorize(Role.Admin), getAll);
router.get('/:id', authorize(Role.Admin), getById);
router.post('/',   authorize(Role.Admin), createSchema, create);
router.put('/:id', authorize(Role.Admin), updateSchema, update);
router.delete('/:id', authorize(Role.Admin), _delete);

export default router;

// ─── Handlers ────────────────────────────────────────────────────────────────

function getAll(_req: Request, res: Response, next: NextFunction): void {
  employeeService.getAll().then((e) => res.json(e)).catch(next);
}

function getById(req: Request, res: Response, next: NextFunction): void {
  employeeService.getById(Number(req.params.id)).then((e) => res.json(e)).catch(next);
}

function create(req: Request, res: Response, next: NextFunction): void {
  employeeService
    .create(req.body as Parameters<typeof employeeService.create>[0])
    .then((e) => res.status(201).json(e))
    .catch(next);
}

function update(req: Request, res: Response, next: NextFunction): void {
  employeeService
    .update(Number(req.params.id), req.body as Parameters<typeof employeeService.update>[1])
    .then((e) => res.json(e))
    .catch(next);
}

function _delete(req: Request, res: Response, next: NextFunction): void {
  employeeService
    .delete(Number(req.params.id))
    .then(() => res.json({ message: 'Employee deleted successfully' }))
    .catch(next);
}

// ─── Validation ───────────────────────────────────────────────────────────────

function createSchema(req: Request, _res: Response, next: NextFunction): void {
  validateRequest(req, next, Joi.object({
    employeeId: Joi.string().required(),
    userEmail:  Joi.string().email().required(),
    position:   Joi.string().required(),
    deptId:     Joi.number().integer().positive().required(),
    hireDate:   Joi.string().allow('').default(''),
  }));
}

function updateSchema(req: Request, _res: Response, next: NextFunction): void {
  validateRequest(req, next, Joi.object({
    employeeId: Joi.string().empty(''),
    userEmail:  Joi.string().email().empty(''),
    position:   Joi.string().empty(''),
    deptId:     Joi.number().integer().positive(),
    hireDate:   Joi.string().allow(''),
  }));
}
