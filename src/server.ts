import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import postgres from 'postgres';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = fastify({ logger: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = postgres(databaseUrl);

async function initSchema(): Promise<void> {
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await sql.unsafe(schema);
  app.log.info('Database schema initialized');
}

app.get('/health', async () => {
  return { status: 'ok' };
});

async function start(): Promise<void> {
  await initSchema();

  const distPath = path.join(__dirname, '..', 'frontend', 'dist');

  await app.register(fastifyStatic, {
    root: distPath,
    prefix: '/',
    wildcard: false,
  });

  app.setNotFoundHandler(async (req, reply) => {
    return reply.sendFile('index.html', distPath);
  });

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`Server listening on port ${port}`);
}

start().catch((err) => {
  app.log.error(err);
  process.exit(1);
});
