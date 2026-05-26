import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from './password.ts';

describe('Password Hashing', () => {
  it('should hash and verify a password', async () => {
    const hash = await hashPassword('my-secret');
    const isValid = await comparePassword('my-secret', hash);
    expect(isValid).toBe(true);
  });

  it('should reject wrong password', async () => {
    const hash = await hashPassword('my-secret');
    const isValid = await comparePassword('wrong-password', hash);
    expect(isValid).toBe(false);
  });
});
