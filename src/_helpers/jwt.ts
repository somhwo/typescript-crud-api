// src/_helpers/jwt.ts

import jwt from 'jsonwebtoken';
import type { AppConfig, JwtPayload } from '../types';
import { Role } from './role';

// ─── Load secret once ────────────────────────────────────────────────────────

function getSecret(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config: AppConfig = require('../../config.json') as AppConfig;
  if (!config.jwtSecret) {
    throw new Error('jwtSecret is not set in config.json');
  }
  return config.jwtSecret;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Creates a signed JWT for the given user.
 * @param userId  - The numeric user id (stored as `sub`).
 * @param role    - The Role enum value.
 * @returns Signed JWT string (expires in 7 days).
 */
export function generateToken(userId: number, role: Role): string {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = { sub: userId, role };
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

/**
 * Verifies a JWT string and returns the decoded payload.
 * Throws a `JsonWebTokenError` / `TokenExpiredError` on failure.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}
