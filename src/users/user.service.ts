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

// ─── Public service object ────────────────────────────────────────────────────

export const userService = {
  authenticate,
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

  if (!user) {
    throw new Error('Email or password is incorrect');
  }

  const isPasswordValid = await bcrypt.compare(params.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Email or password is incorrect');
  }

  const token = generateToken(user.id, user.role);

  return {
    id:        user.id,
    email:     user.email,
    firstName: user.firstName,
    lastName:  user.lastName,
    role:      user.role,
    token,
  };
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

async function getAll(): Promise<SafeUser[]> {
  const users = await db.User.findAll();
  return users.map(toSafeUser);
}

async function getById(id: number): Promise<SafeUser> {
  const user = await getUser(id);
  return toSafeUser(user);
}

async function create(params: CreateUserParams): Promise<void> {
  // Guard: unique email
  const existing = await db.User.findOne({ where: { email: params.email } });
  if (existing) {
    throw new Error(`Email "${params.email}" is already registered`);
  }

  const passwordHash = await bcrypt.hash(params.password, 10);

  await db.User.create({
    title:        params.title,
    firstName:    params.firstName,
    lastName:     params.lastName,
    email:        params.email,
    role:         params.role ?? Role.User,
    passwordHash,
  });
}

async function update(id: number, params: UpdateUserParams): Promise<void> {
  const user = await getUser(id);

  // Hash new password if provided.
  if (params.password) {
    const passwordHash = await bcrypt.hash(params.password, 10);
    await user.update({
      ...omitPasswordFields(params),
      passwordHash,
    });
  } else {
    await user.update(omitPasswordFields(params));
  }
}

async function _delete(id: number): Promise<void> {
  const user = await getUser(id);
  await user.destroy();
}

// ─── Private helpers ─────────────────────────────────────────────────────────

/**
 * Fetches a user including the passwordHash (needed for password updates).
 * Throws a string error – which the error handler maps to 404 – when not found.
 */
async function getUser(id: number): Promise<User> {
  const user = await db.User.scope('withHash').findByPk(id);
  if (!user) throw new Error('User not found');
  return user;
}

/** Strips `passwordHash`, `password`, and `confirmPassword` from an update payload. */
function omitPasswordFields(
  params: UpdateUserParams,
): Omit<UpdateUserParams, 'password' | 'confirmPassword'> {
  const { password: _p, confirmPassword: _c, ...rest } = params;
  return rest;
}

/** Converts a User instance to a safe public representation. */
function toSafeUser(user: User): SafeUser {
  return {
    id:        user.id,
    email:     user.email,
    title:     user.title,
    firstName: user.firstName,
    lastName:  user.lastName,
    role:      user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
