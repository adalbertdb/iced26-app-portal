import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import authenticate from '../src/auth-plugin.js';
import { signToken } from '../src/auth.js';

const TEST_DB_URL = 'postgres://postgres:postgres@localhost:5434/iced26';

describe('POST /admin/login', () => {
  let fastify;
  let sql;

  before(async () => {
    sql = postgres(TEST_DB_URL);

    fastify = Fastify();

    fastify.post('/admin/login', async (request, reply) => {
      const { username, password } = request.body;

      if (!username || !password) {
        reply.code(401).send({ error: 'Invalid credentials' });
        return;
      }

      const users = await sql`SELECT id, username, password_hash FROM users WHERE username = ${username}`;

      if (users.length === 0) {
        reply.code(401).send({ error: 'Invalid credentials' });
        return;
      }

      const user = users[0];
      const valid = await bcrypt.compare(password, user.password_hash);

      if (!valid) {
        reply.code(401).send({ error: 'Invalid credentials' });
        return;
      }

      const token = signToken({ userId: user.id, username: user.username });
      reply.send({ token });
    });

    fastify.get('/admin/protected-test', { preHandler: [authenticate] }, async (request) => {
      return { user: request.user };
    });

    await fastify.ready();

    // Clean up and seed test user
    await sql`DELETE FROM users WHERE username = 'testadmin'`;
    const hash = await bcrypt.hash('testpassword', 10);
    await sql`INSERT INTO users (username, password_hash) VALUES ('testadmin', ${hash})`;
  });

  it('returns 401 for invalid credentials', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { username: 'wrong', password: 'wrong' },
    });
    assert.strictEqual(response.statusCode, 401);
  });

  it('returns token for valid credentials', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { username: 'testadmin', password: 'testpassword' },
    });
    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    assert.ok(body.token);
  });

  it('protected route rejects without token', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/admin/protected-test',
    });
    assert.strictEqual(response.statusCode, 401);
  });

  it('protected route accepts valid token', async () => {
    const loginResponse = await fastify.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { username: 'testadmin', password: 'testpassword' },
    });
    const { token } = JSON.parse(loginResponse.body);

    const response = await fastify.inject({
      method: 'GET',
      url: '/admin/protected-test',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(response.statusCode, 200);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.user.username, 'testadmin');
  });

  after(async () => {
    await sql.end();
    await fastify.close();
  });
});
