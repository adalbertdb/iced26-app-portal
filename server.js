import 'dotenv/config';
import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/iced26';
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
