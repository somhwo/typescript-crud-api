// src/types/index.ts

import type { Request } from 'express';
import { Role } from '../_helpers/role';

// ─── Database Config ────────────────────────────────────────────────────────

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface AppConfig {
  database: DatabaseConfig;
  jwtSecret: string;
}

// ─── JWT ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: number;
  role: Role;
  iat?: number;
  exp?: number;
}

// ─── Express augmentation ────────────────────────────────────────────────────

/**
 * Extends Express's Request to carry the decoded JWT payload after
 * the authorize middleware runs.
 */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

// ─── User Service Params ─────────────────────────────────────────────────────

export interface CreateUserParams {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: Role;
}

export interface UpdateUserParams {
  title?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: Role;
}

export interface AuthenticateParams {
  email: string;
  password: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T = undefined> {
  message: string;
  data?: T;
}

export interface AuthResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  token: string;
}

// ─── User Safe (no passwordHash) ─────────────────────────────────────────────

export interface SafeUser {
  id: number;
  email: string;
  title: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
