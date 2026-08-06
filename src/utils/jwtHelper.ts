import jwt from 'jsonwebtoken';
import { UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'apex-payroll-jwt-access-secret-2026-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'apex-payroll-jwt-refresh-secret-2026-key';

export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  companyId?: string;
  iat?: number;
  exp?: number;
}

export function generateAccessToken(payload: { userId: string; username: string; email: string; role: UserRole; companyId?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function generateRefreshToken(payload: { userId: string; username: string; email: string; role: UserRole; companyId?: string }): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  } catch (err) {
    return null;
  }
}
