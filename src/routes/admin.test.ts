import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app.ts';
import { hashPassword } from '../auth/password.ts';
import type { FastifyInstance } from 'fastify';

describe('POST /admin/login', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    // Seed a test user
    const passwordHash = await hashPassword('admin');
    await app.sql`INSERT INTO users (username, password_hash) VALUES ('admin', ${passwordHash}) ON CONFLICT DO NOTHING`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return JWT for valid credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { username: 'admin', password: 'admin' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.token).toBeDefined();
  });

  it('should return 401 for invalid credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { username: 'admin', password: 'wrong' },
    });

    expect(res.statusCode).toBe(401);
  });
});

describe('Protected routes', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    // Seed a test user
    const passwordHash = await hashPassword('admin');
    await app.sql`INSERT INTO users (username, password_hash) VALUES ('admin', ${passwordHash}) ON CONFLICT DO NOTHING`;
    // Login to get token
    const loginRes = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { username: 'admin', password: 'admin' },
    });
    token = JSON.parse(loginRes.payload).token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 without token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/protected-test',
    });
    expect(res.statusCode).toBe(401);
  });

  it('should return 200 with valid token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/protected-test',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
  });
});
