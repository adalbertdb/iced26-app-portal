import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from './jwt.ts';

describe('JWT Auth', () => {
  it('should sign and verify a token', () => {
    const token = signToken('user-123');
    const payload = verifyToken(token);
    expect(payload.userId).toBe('user-123');
  });

  it('should throw on invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow();
  });
});
