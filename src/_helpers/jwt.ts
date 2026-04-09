// src/_helpers/jwt.ts

import jwt from 'jsonwebtoken';
import type { AppConfig, JwtPayload } from '../types';
import { Role } from './role';

function getSecret(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config: AppConfig = require('../../config.json') as AppConfig;
  if (!config.jwtSecret) throw new Error('jwtSecret is not set in config.json');
  return config.jwtSecret;
}

export function generateToken(userId: number, role: Role): string {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = { sub: userId, role };
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as unknown as JwtPayload;
}
