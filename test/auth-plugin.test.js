import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import authenticate from '../src/auth-plugin.js';
import { signToken } from '../src/auth.js';

describe('auth plugin', () => {
  let fastify;

  before(async () => {
    fastify = Fastify();
    fastify.get('/protected', { preHandler: [authenticate] }, async () => {
      return { message: 'success' };
    });
    await fastify.ready();
  });

  it('returns 401 when no Authorization header', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/protected',
    });
    assert.strictEqual(response.statusCode, 401);
  });

  it('returns 401 for invalid token', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/protected',
      headers: { Authorization: 'Bearer invalid-token' },
    });
    assert.strictEqual(response.statusCode, 401);
  });

  it('allows access with valid token', async () => {
    const token = signToken({ userId: 1, username: 'admin' });
    const response = await fastify.inject({
      method: 'GET',
      url: '/protected',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.message, 'success');
  });
});
