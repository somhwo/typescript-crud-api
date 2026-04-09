// src/types/index.ts

import { Role } from '../_helpers/role';

// ─── Config ───────────────────────────────────────────────────────────────────

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

// ─── JWT ─────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: number;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest {
  user: JwtPayload;
}

// ─── User ─────────────────────────────────────────────────────────────────────

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
  verified?: boolean;
}

export interface AuthenticateParams {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  verified: boolean;
  token: string;
}

export interface SafeUser {
  id: number;
  email: string;
  title: string;
  firstName: string;
  lastName: string;
  role: Role;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Department ───────────────────────────────────────────────────────────────

export interface CreateDepartmentParams {
  name: string;
  description?: string;
}

export interface UpdateDepartmentParams {
  name?: string;
  description?: string;
}

export interface SafeDepartment {
  id: number;
  name: string;
  description: string;
}

// ─── Employee ─────────────────────────────────────────────────────────────────

export interface CreateEmployeeParams {
  employeeId: string;
  userEmail: string;
  position: string;
  deptId: number;
  hireDate?: string;
}

export interface UpdateEmployeeParams {
  employeeId?: string;
  userEmail?: string;
  position?: string;
  deptId?: number;
  hireDate?: string;
}

export interface SafeEmployee {
  id: number;
  employeeId: string;
  userEmail: string;
  position: string;
  deptId: number;
  deptName?: string;
  hireDate: string;
}

// ─── Request ──────────────────────────────────────────────────────────────────

export type RequestType   = 'Equipment' | 'Leave' | 'Resources';
export type RequestStatus = 'Pending'   | 'Approved' | 'Rejected';

export interface RequestItem {
  name: string;
  qty: number;
}

export interface CreateRequestParams {
  type: RequestType;
  items: RequestItem[];
}

export interface SafeRequest {
  id: number;
  employeeEmail: string;
  type: RequestType;
  items: RequestItem[];
  status: RequestStatus;
  date: string;
}
