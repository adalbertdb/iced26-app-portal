import fastify from 'fastify';
import multipart from '@fastify/multipart';
import postgres from 'postgres';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { registerAdminRoutes } from './routes/admin.ts';
import { registerApiRoutes } from './routes/api.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildApp() {
  const app = fastify({ logger: false });

  await app.register(multipart);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const sql = postgres(databaseUrl);

  async function initSchema(): Promise<void> {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await sql.unsafe(schema);
  }

  await initSchema();

  app.decorate('sql', sql);

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  await registerAdminRoutes(app, sql);
  await registerApiRoutes(app, sql);

  return app;
}
