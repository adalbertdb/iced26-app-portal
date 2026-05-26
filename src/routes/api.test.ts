import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app.ts';
import { ingestConferenceData } from '../csv/ingestion.ts';
import type { FastifyInstance } from 'fastify';

describe('GET /api/schedule', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();

    // Seed test data
    const data = {
      rooms: [{ Id: 'ROOM-1', Name: 'Main Hall', Description: 'Large auditorium' }],
      sessions: [{
        Id: 'SES-1', Number: '1', Title: 'Opening', Date: '2026-06-15',
        'Start time': '09:00', Duration: '60', Kind: 'plenary',
        Description: 'Welcome', 'Room Id': 'ROOM-1', Chairs: 'Dr. Smith'
      }],
      talks: [{
        Id: 'TALK-1', Number: '1', Title: 'Keynote', Date: '2026-06-15',
        'Start time': '09:00', Duration: '60', Abstract: 'Important talk',
        Track: 'main', 'Session Id': 'SES-1', Authors: 'Dr. Smith'
      }],
      authors: [{
        'Talk id': 'TALK-1', 'Person Id': 'P1', 'First name': 'John',
        'Last name': 'Smith', 'Country code': 'US', Affiliation: 'Uni',
        Email: 'john@example.com', 'Web page': '', 'Presenter?': 'yes'
      }],
      sessionChairs: [{
        'Session Id': 'SES-1', 'Person Id': 'P1', 'First name': 'John',
        'Last name': 'Smith', Country: 'US', Affiliation: 'Uni',
        Email: 'john@example.com', 'Web page': ''
      }],
    };

    await ingestConferenceData(app.sql, data);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 with schedule JSON', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/schedule',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.rooms).toBeDefined();
    expect(body.events).toBeDefined();
    expect(body.sessionBlocks).toBeDefined();
    expect(body.speakers).toBeDefined();
  });

  it('should return rooms with correct data', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/schedule',
    });

    const body = JSON.parse(res.payload);
    expect(body.rooms).toHaveLength(1);
    expect(body.rooms[0].id).toBe('ROOM-1');
    expect(body.rooms[0].name).toBe('Main Hall');
  });

  it('should include timezone offset in dates', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/schedule',
    });

    const body = JSON.parse(res.payload);
    expect(body.events.length).toBeGreaterThan(0);
    const event = body.events[0];
    expect(event.start).toContain('+02:00');
  });
});
