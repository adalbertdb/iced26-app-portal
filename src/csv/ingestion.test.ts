import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app.ts';
import { ingestConferenceData } from './ingestion.ts';
import type { FastifyInstance } from 'fastify';

describe('Ingestion Service', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should atomically insert conference data', async () => {
    const data = {
      rooms: [{ Id: 'ROOM-1', Name: 'Main Hall', Description: 'Large room' }],
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

    const result = await ingestConferenceData(app.sql, data);
    expect(result.rooms).toBe(1);
    expect(result.sessions).toBe(1);
    expect(result.talks).toBe(1);

    // Verify data exists
    const rooms = await app.sql`SELECT * FROM rooms`;
    expect(rooms).toHaveLength(1);
    expect(rooms[0].name).toBe('Main Hall');

    const talks = await app.sql`SELECT * FROM talks`;
    expect(talks).toHaveLength(1);
    expect(talks[0].title).toBe('Keynote');
  });
});
