import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app.ts';
import { hashPassword } from '../auth/password.ts';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createTestZip(): Buffer {
  const zip = new AdmZip();

  zip.addFile('rooms.csv', Buffer.from(`Id,Name,Description
ROOM-1,Main Hall,Large auditorium`));

  zip.addFile('sessions.csv', Buffer.from(`Id,Number,Title,Date,Start time,Duration,Kind,Description,Room Id,Chairs
SES-1,1,Opening,2026-06-15,09:00,60,plenary,Welcome,ROOM-1,Dr. Smith`));

  zip.addFile('talks.csv', Buffer.from(`Id,Number,Title,Date,Start time,Duration,Abstract,Track,Session Id,Authors
TALK-1,1,Keynote,2026-06-15,09:00,60,Important talk,main,SES-1,Dr. Smith`));

  zip.addFile('authors.csv', Buffer.from(`Talk id,Person Id,First Name,Last Name,Country,Affiliation,Email,Web page,IsPresenter
TALK-1,P1,John,Smith,US,Uni,john@example.com,,true`));

  zip.addFile('session_chairs.csv', Buffer.from(`Session Id,Person Id,First Name,Last Name,Country,Affiliation,Email,Web page
SES-1,P1,John,Smith,US,Uni,john@example.com,`));

  return zip.toBuffer();
}

describe('POST /admin/upload', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    // Seed admin user
    const passwordHash = await hashPassword('admin');
    await app.sql`INSERT INTO users (username, password_hash) VALUES ('admin', ${passwordHash}) ON CONFLICT DO NOTHING`;
    // Login
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

  it('should upload and ingest valid zip', async () => {
    const zipBuffer = createTestZip();

    // Create multipart form-data manually for testing
    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
    const payload = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.zip"\r\nContent-Type: application/zip\r\n\r\n`),
      zipBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const res = await app.inject({
      method: 'POST',
      url: '/admin/upload',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Imported');
  });

  it('should return 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/upload',
    });
    expect(res.statusCode).toBe(401);
  });
});
