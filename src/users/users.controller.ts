// src/users/users.controller.ts

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { Role } from '../_helpers/role';
import { authorize } from '../_middleware/authorize';
import { validateRequest } from '../_middleware/validateRequest';
import { userService } from './user.service';
import type { AuthenticatedRequest } from '../types';

const router = Router();

// ─── Route definitions ────────────────────────────────────────────────────────
//
//  POST   /users/authenticate   – obtain a JWT                  (public)
//  GET    /users                – list all users                 (Admin only)
//  GET    /users/:id            – get user by id                 (authenticated)
//  POST   /users                – register a new user            (public)
//  PUT    /users/:id            – update a user                  (authenticated)
//  DELETE /users/:id            – delete a user                  (Admin only)

router.post('/authenticate', authenticateSchema, authenticate);
router.get('/', authorize(Role.Admin), getAll);
router.get('/:id', authorize(), getById);
router.post('/', createSchema, create);
router.put('/:id', authorize(), updateSchema, update);
router.delete('/:id', authorize(Role.Admin), _delete);

export default router;

// ─── Handlers ────────────────────────────────────────────────────────────────

function authenticate(req: Request, res: Response, next: NextFunction): void {
  userService
    .authenticate(req.body as { email: string; password: string })
    .then((data) => res.json(data))
    .catch(next);
}

function getAll(_req: Request, res: Response, next: NextFunction): void {
  userService
    .getAll()
    .then((users) => res.json(users))
    .catch(next);
}

function getById(req: Request, res: Response, next: NextFunction): void {
  const requestedId = Number(req.params.id);
  const authReq     = req as AuthenticatedRequest;

  // A non-admin can only view their own record.
  if (authReq.user.role !== Role.Admin && authReq.user.sub !== requestedId) {
    res.status(403).json({ message: 'Forbidden – you can only view your own account' });
    return;
  }

  userService
    .getById(requestedId)
    .then((user) => res.json(user))
    .catch(next);
}

function create(req: Request, res: Response, next: NextFunction): void {
  userService
    .create(req.body as Parameters<typeof userService.create>[0])
    .then(() => res.status(201).json({ message: 'User created successfully' }))
    .catch(next);
}

function update(req: Request, res: Response, next: NextFunction): void {
  const requestedId = Number(req.params.id);
  const authReq     = req as AuthenticatedRequest;

  // A non-admin can only update their own record.
  if (authReq.user.role !== Role.Admin && authReq.user.sub !== requestedId) {
    res.status(403).json({ message: 'Forbidden – you can only update your own account' });
    return;
  }

  userService
    .update(requestedId, req.body as Parameters<typeof userService.update>[1])
    .then(() => res.json({ message: 'User updated successfully' }))
    .catch(next);
}

function _delete(req: Request, res: Response, next: NextFunction): void {
  userService
    .delete(Number(req.params.id))
    .then(() => res.json({ message: 'User deleted successfully' }))
    .catch(next); // ← was missing in original – uncaught promise rejection fixed
}

// ─── Validation schemas ───────────────────────────────────────────────────────

function authenticateSchema(req: Request, _res: Response, next: NextFunction): void {
  const schema = Joi.object({
    email:    Joi.string().email().required(),
    password: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function createSchema(req: Request, _res: Response, next: NextFunction): void {
  const schema = Joi.object({
    title:           Joi.string().required(),
    firstName:       Joi.string().required(),
    lastName:        Joi.string().required(),
    role:            Joi.string().valid(Role.Admin, Role.User).default(Role.User),
    email:           Joi.string().email().required(),
    password:        Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match',
    }),
  });
  validateRequest(req, next, schema);
}

function updateSchema(req: Request, _res: Response, next: NextFunction): void {
  const schema = Joi.object({
    title:           Joi.string().empty(''),
    firstName:       Joi.string().empty(''),
    lastName:        Joi.string().empty(''),
    role:            Joi.string().valid(Role.Admin, Role.User).empty(''),
    email:           Joi.string().email().empty(''),
    password:        Joi.string().min(6).empty(''),
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .empty('')
      .messages({ 'any.only': 'Passwords do not match' }),
  }).with('password', 'confirmPassword');
  validateRequest(req, next, schema);
}
