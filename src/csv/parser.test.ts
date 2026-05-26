import { describe, it, expect } from 'vitest';
import { parseCsv } from './parser.ts';

describe('CSV Parser', () => {
  it('should parse a simple CSV with headers', async () => {
    const csv = `Id,Name,Description
ROOM-1,Main Hall,Large auditorium
ROOM-2,Room B,Small room`;

    const records = await parseCsv(csv);
    expect(records).toHaveLength(2);
    expect(records[0]).toEqual({ Id: 'ROOM-1', Name: 'Main Hall', Description: 'Large auditorium' });
    expect(records[1]).toEqual({ Id: 'ROOM-2', Name: 'Room B', Description: 'Small room' });
  });

  it('should handle multiline quoted fields', async () => {
    const csv = `Id,Abstract
TALK-1,"This is a multiline\nabstract with HTML <br/>"`;

    const records = await parseCsv(csv);
    expect(records).toHaveLength(1);
    expect(records[0].Abstract).toBe('This is a multiline\nabstract with HTML <br/>');
  });
});
