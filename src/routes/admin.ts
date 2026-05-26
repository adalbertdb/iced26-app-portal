import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type postgres from 'postgres';
import { signToken, verifyToken } from '../auth/jwt.ts';
import { comparePassword } from '../auth/password.ts';
import { parseCsv } from '../csv/parser.ts';
import { validateConferenceData, ValidationError } from '../csv/validator.ts';
import { ingestConferenceData } from '../csv/ingestion.ts';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export async function registerAdminRoutes(app: FastifyInstance, sql: postgres.Sql<{}>) {
  app.post('/admin/login', async (req, reply) => {
    const { username, password } = req.body as { username: string; password: string };

    const users = await sql`SELECT * FROM users WHERE username = ${username}`;
    if (users.length === 0) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = signToken(String(user.id));
    return { token };
  });

  // Auth preHandler
  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const token = authHeader.slice(7);
    try {
      const payload = verifyToken(token);
      (req as any).user = payload;
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Test protected route
  app.get('/admin/protected-test', {
    preHandler: [app.authenticate as any],
    handler: async () => {
      return { message: 'OK' };
    },
  });

  // Upload route
  app.post('/admin/upload', {
    preHandler: [app.authenticate as any],
    handler: async (req, reply) => {
      const tmpDir = path.join('/tmp', randomUUID());
      try {
        const data = await req.file();
        if (!data) {
          return reply.status(400).send({ success: false, error: 'No file uploaded' });
        }

        // Save zip
        fs.mkdirSync(tmpDir, { recursive: true });
        const zipPath = path.join(tmpDir, 'upload.zip');
        await data.toBuffer().then(buf => fs.writeFileSync(zipPath, buf));

        // Extract
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(tmpDir, true);

        // Parse CSVs
        const readCsv = (filename: string) => {
          const filePath = path.join(tmpDir, filename);
          if (!fs.existsSync(filePath)) {
            throw new ValidationError(`Missing file: ${filename}`);
          }
          return parseCsv(fs.readFileSync(filePath, 'utf-8'));
        };

        const rooms = await readCsv('rooms.csv');
        const sessions = await readCsv('sessions.csv');
        const talks = await readCsv('talks.csv');
        const authors = await readCsv('authors.csv');
        const sessionChairs = await readCsv('session_chairs.csv');

        const conferenceData = { rooms, sessions, talks, authors, sessionChairs };

        // Validate
        validateConferenceData(conferenceData);

        // Ingest
        const result = await ingestConferenceData(sql, conferenceData);

        return {
          success: true,
          message: `Imported ${result.talks} talks, ${result.sessions} sessions, ${result.rooms} rooms`,
        };
      } catch (err) {
        if (err instanceof ValidationError) {
          return reply.status(400).send({ success: false, error: err.message });
        }
        app.log.error(err);
        return reply.status(500).send({ success: false, error: 'Upload failed' });
      } finally {
        // Cleanup
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    },
  });
}
