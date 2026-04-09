// src/users/user.service.ts

import bcrypt from 'bcryptjs';
import { db } from '../_helpers/db';
import { generateToken } from '../_helpers/jwt';
import { Role } from '../_helpers/role';
import { User } from './user.model';
import type {
  AuthenticateParams,
  AuthResponse,
  CreateUserParams,
  SafeUser,
  UpdateUserParams,
} from '../types';

export const userService = {
  authenticate,
  verifyEmail,
  getAll,
  getById,
  create,
  update,
  delete: _delete,
};

// ─── Authenticate ─────────────────────────────────────────────────────────────

async function authenticate(params: AuthenticateParams): Promise<AuthResponse> {
  const user = await db.User.scope('withHash').findOne({
    where: { email: params.email },
  });

  if (!user) throw new Error('Email or password is incorrect');

  const valid = await bcrypt.compare(params.password, user.passwordHash);
  if (!valid) throw new Error('Email or password is incorrect');

  if (!user.verified) throw new Error('Please verify your email before logging in');

  const token = generateToken(user.id, user.role);

  return {
    id:        user.id,
    email:     user.email,
    firstName: user.firstName,
    lastName:  user.lastName,
    role:      user.role,
    verified:  user.verified,
    token,
  };
}

// ─── Verify Email (simulated) ─────────────────────────────────────────────────

async function verifyEmail(email: string): Promise<void> {
  const user = await db.User.findOne({ where: { email } });
  if (!user) throw new Error('Account not found');
  if (user.verified) return; // already verified – silently succeed
  await user.update({ verified: true });
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

async function getAll(): Promise<SafeUser[]> {
  const users = await db.User.findAll();
  return users.map(toSafeUser);
}

async function getById(id: number): Promise<SafeUser> {
  return toSafeUser(await getUser(id));
}

async function create(params: CreateUserParams): Promise<void> {
  const existing = await db.User.findOne({ where: { email: params.email } });
  if (existing) throw new Error(`Email "${params.email}" is already registered`);

  const passwordHash = await bcrypt.hash(params.password, 10);

  await db.User.create({
    title:        params.title,
    firstName:    params.firstName,
    lastName:     params.lastName,
    email:        params.email,
    role:         params.role ?? Role.User,
    verified:     false,
    passwordHash,
  });
}

async function update(id: number, params: UpdateUserParams): Promise<void> {
  const user = await getUser(id);

  if (params.password) {
    const passwordHash = await bcrypt.hash(params.password, 10);
    const { password: _p, confirmPassword: _c, ...rest } = params;
    await user.update({ ...rest, passwordHash });
  } else {
    const { password: _p, confirmPassword: _c, ...rest } = params;
    await user.update(rest);
  }
}

async function _delete(id: number): Promise<void> {
  await (await getUser(id)).destroy();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUser(id: number): Promise<User> {
  const user = await db.User.scope('withHash').findByPk(id);
  if (!user) throw new Error('User not found');
  return user;
}

function toSafeUser(user: User): SafeUser {
  return {
    id:        user.id,
    email:     user.email,
    title:     user.title,
    firstName: user.firstName,
    lastName:  user.lastName,
    role:      user.role,
    verified:  user.verified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
