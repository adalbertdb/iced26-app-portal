export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function assertRequired(file: string, rowIdx: number, record: Record<string, string>, field: string): string {
  const value = record[field];
  if (!value || value.trim() === '') {
    throw new ValidationError(`${file} row ${rowIdx}: ${field} is required`);
  }
  return value.trim();
}

function assertDate(file: string, rowIdx: number, record: Record<string, string>, field: string): string {
  const value = assertRequired(file, rowIdx, record, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError(`${file} row ${rowIdx}: '${field}' must be YYYY-MM-DD`);
  }
  return value;
}

function assertTime(file: string, rowIdx: number, record: Record<string, string>, field: string): string {
  const value = assertRequired(file, rowIdx, record, field);
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new ValidationError(`${file} row ${rowIdx}: '${field}' must be HH:MM`);
  }
  return value;
}

function assertPositiveInt(file: string, rowIdx: number, record: Record<string, string>, field: string): number {
  const value = assertRequired(file, rowIdx, record, field);
  const num = parseInt(value, 10);
  if (isNaN(num) || num <= 0) {
    throw new ValidationError(`${file} row ${rowIdx}: ${field} must be a positive integer`);
  }
  return num;
}

interface ConferenceData {
  rooms: Record<string, string>[];
  sessions: Record<string, string>[];
  talks: Record<string, string>[];
  authors: Record<string, string>[];
  sessionChairs: Record<string, string>[];
}

export function validateConferenceData(data: ConferenceData): void {
  // Validate rooms
  const roomIds = new Set<string>();
  for (let i = 0; i < data.rooms.length; i++) {
    const rowIdx = i + 2; // 1-indexed, accounting for header
    const id = assertRequired('rooms.csv', rowIdx, data.rooms[i], 'Id');
    assertRequired('rooms.csv', rowIdx, data.rooms[i], 'Name');
    roomIds.add(id);
  }

  // Validate sessions
  const sessionIds = new Set<string>();
  for (let i = 0; i < data.sessions.length; i++) {
    const rowIdx = i + 2;
    const id = assertRequired('sessions.csv', rowIdx, data.sessions[i], 'Id');
    assertRequired('sessions.csv', rowIdx, data.sessions[i], 'Title');
    assertDate('sessions.csv', rowIdx, data.sessions[i], 'Date');
    assertTime('sessions.csv', rowIdx, data.sessions[i], 'Start time');
    assertPositiveInt('sessions.csv', rowIdx, data.sessions[i], 'Duration');
    const roomId = assertRequired('sessions.csv', rowIdx, data.sessions[i], 'Room Id');
    if (!roomIds.has(roomId)) {
      throw new ValidationError(`sessions.csv row ${rowIdx}: 'Room Id' ${roomId} does not exist in rooms`);
    }
    sessionIds.add(id);
  }

  // Validate talks
  for (let i = 0; i < data.talks.length; i++) {
    const rowIdx = i + 2;
    assertRequired('talks.csv', rowIdx, data.talks[i], 'Id');
    assertRequired('talks.csv', rowIdx, data.talks[i], 'Title');
    assertDate('talks.csv', rowIdx, data.talks[i], 'Date');
    assertTime('talks.csv', rowIdx, data.talks[i], 'Start time');
    assertPositiveInt('talks.csv', rowIdx, data.talks[i], 'Duration');
    const sessionId = assertRequired('talks.csv', rowIdx, data.talks[i], 'Session Id');
    if (!sessionIds.has(sessionId)) {
      throw new ValidationError(`talks.csv row ${rowIdx}: 'Session Id' ${sessionId} does not exist in sessions`);
    }
  }

  // Validate authors
  for (let i = 0; i < data.authors.length; i++) {
    const rowIdx = i + 2;
    assertRequired('authors.csv', rowIdx, data.authors[i], 'Talk id');
    assertRequired('authors.csv', rowIdx, data.authors[i], 'Person Id');
    assertRequired('authors.csv', rowIdx, data.authors[i], 'First Name');
    assertRequired('authors.csv', rowIdx, data.authors[i], 'Last Name');
  }

  // Validate session chairs
  for (let i = 0; i < data.sessionChairs.length; i++) {
    const rowIdx = i + 2;
    assertRequired('session_chairs.csv', rowIdx, data.sessionChairs[i], 'Session Id');
    assertRequired('session_chairs.csv', rowIdx, data.sessionChairs[i], 'Person Id');
    assertRequired('session_chairs.csv', rowIdx, data.sessionChairs[i], 'First Name');
    assertRequired('session_chairs.csv', rowIdx, data.sessionChairs[i], 'Last Name');
  }
}
