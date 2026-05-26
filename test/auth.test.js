import { describe, it } from 'node:test';
import assert from 'node:assert';
import { signToken, verifyToken } from '../src/auth.js';

describe('auth utilities', () => {
  it('signToken creates a verifiable JWT', () => {
    const payload = { userId: 1, username: 'admin' };
    const token = signToken(payload);
    assert.ok(token, 'token should be defined');
    assert.strictEqual(typeof token, 'string');
  });

  it('verifyToken returns payload for valid token', () => {
    const payload = { userId: 1, username: 'admin' };
    const token = signToken(payload);
    const decoded = verifyToken(token);
    assert.strictEqual(decoded.userId, 1);
    assert.strictEqual(decoded.username, 'admin');
  });

  it('verifyToken throws for invalid token', () => {
    assert.throws(() => verifyToken('invalid-token'));
  });
});
