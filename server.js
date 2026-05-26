import 'dotenv/config';
import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { signToken } from './src/auth.js';
import authenticate from './src/auth-plugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5434/iced26';
const PORT = Number(process.env.PORT) || 3000;

const sql = postgres(DATABASE_URL);

async function runSchema() {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  await sql.unsafe(schema);
}

const fastify = Fastify({
  logger: true,
});

fastify.get('/health', async () => {
  return { status: 'ok' };
});

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

fastify.register(staticPlugin, {
  root: join(__dirname, 'dist'),
  prefix: '/',
});

async function start() {
  await runSchema();
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
}

start().catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
