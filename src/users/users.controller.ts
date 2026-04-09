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

// ─── Routes ───────────────────────────────────────────────────────────────────
//  POST   /users/authenticate    – login, returns JWT          (public)
//  POST   /users/verify-email    – mark account as verified    (public/simulated)
//  GET    /users                 – list all accounts           (Admin)
//  GET    /users/:id             – get account by id           (self or Admin)
//  POST   /users                 – register new account        (public)
//  PUT    /users/:id             – update account              (self or Admin)
//  DELETE /users/:id             – delete account              (Admin)

router.post('/authenticate',  authenticateSchema,  authenticate);
router.post('/verify-email',  verifyEmailSchema,   verifyEmail);
router.get('/',               authorize(Role.Admin), getAll);
router.get('/:id',            authorize(),           getById);
router.post('/',              createSchema,          create);
router.put('/:id',            authorize(), updateSchema, update);
router.delete('/:id',         authorize(Role.Admin), _delete);

export default router;

// ─── Handlers ────────────────────────────────────────────────────────────────

function authenticate(req: Request, res: Response, next: NextFunction): void {
  userService.authenticate(req.body as { email: string; password: string })
    .then((data) => res.json(data))
    .catch(next);
}

function verifyEmail(req: Request, res: Response, next: NextFunction): void {
  userService.verifyEmail((req.body as { email: string }).email)
    .then(() => res.json({ message: 'Email verified successfully' }))
    .catch(next);
}

function getAll(_req: Request, res: Response, next: NextFunction): void {
  userService.getAll()
    .then((users) => res.json(users))
    .catch(next);
}

function getById(req: Request, res: Response, next: NextFunction): void {
  const requestedId = Number(req.params.id);
  const { user } = req as unknown as AuthenticatedRequest;

  if (user.role !== Role.Admin && user.sub !== requestedId) {
    res.status(403).json({ message: 'Forbidden – you can only view your own account' });
    return;
  }

  userService.getById(requestedId)
    .then((u) => res.json(u))
    .catch(next);
}

function create(req: Request, res: Response, next: NextFunction): void {
  userService.create(req.body as Parameters<typeof userService.create>[0])
    .then(() => res.status(201).json({ message: 'Registration successful. Please verify your email.' }))
    .catch(next);
}

function update(req: Request, res: Response, next: NextFunction): void {
  const requestedId = Number(req.params.id);
  const { user } = req as unknown as AuthenticatedRequest;

  if (user.role !== Role.Admin && user.sub !== requestedId) {
    res.status(403).json({ message: 'Forbidden – you can only update your own account' });
    return;
  }

  userService.update(requestedId, req.body as Parameters<typeof userService.update>[1])
    .then(() => res.json({ message: 'Account updated successfully' }))
    .catch(next);
}

function _delete(req: Request, res: Response, next: NextFunction): void {
  userService.delete(Number(req.params.id))
    .then(() => res.json({ message: 'Account deleted successfully' }))
    .catch(next);
}

// ─── Validation schemas ───────────────────────────────────────────────────────

function authenticateSchema(req: Request, _res: Response, next: NextFunction): void {
  validateRequest(req, next, Joi.object({
    email:    Joi.string().email().required(),
    password: Joi.string().required(),
  }));
}

function verifyEmailSchema(req: Request, _res: Response, next: NextFunction): void {
  validateRequest(req, next, Joi.object({
    email: Joi.string().email().required(),
  }));
}

function createSchema(req: Request, _res: Response, next: NextFunction): void {
  validateRequest(req, next, Joi.object({
    title:           Joi.string().required(),
    firstName:       Joi.string().required(),
    lastName:        Joi.string().required(),
    role:            Joi.string().valid(Role.Admin, Role.User).default(Role.User),
    email:           Joi.string().email().required(),
    password:        Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({ 'any.only': 'Passwords do not match' }),
  }));
}

function updateSchema(req: Request, _res: Response, next: NextFunction): void {
  validateRequest(req, next, Joi.object({
    title:           Joi.string().empty(''),
    firstName:       Joi.string().empty(''),
    lastName:        Joi.string().empty(''),
    role:            Joi.string().valid(Role.Admin, Role.User).empty(''),
    email:           Joi.string().email().empty(''),
    verified:        Joi.boolean(),
    password:        Joi.string().min(6).empty(''),
    confirmPassword: Joi.string().valid(Joi.ref('password')).empty('')
      .messages({ 'any.only': 'Passwords do not match' }),
  }).with('password', 'confirmPassword'));
}
