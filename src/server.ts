import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { buildApp } from './app.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function start(): Promise<void> {
  const app = await buildApp();

  // Enable request logging for the running server (buildApp disables it for tests)
  app.log.level = 'info';

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
  console.error(err);
  process.exit(1);
});
