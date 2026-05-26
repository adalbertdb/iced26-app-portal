import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface TokenPayload {
  userId: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload;
}
