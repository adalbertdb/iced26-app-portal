import { describe, it, expect } from 'vitest';
import { validateConferenceData, ValidationError } from './validator.ts';

describe('CSV Validator', () => {
  it('should pass with valid data', () => {
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
        'Talk id': 'TALK-1', 'Person Id': 'P1', 'First Name': 'John',
        'Last Name': 'Smith', Country: 'US', Affiliation: 'Uni',
        Email: 'john@example.com', 'Web page': '', IsPresenter: 'true'
      }],
      sessionChairs: [{
        'Session Id': 'SES-1', 'Person Id': 'P1', 'First Name': 'John',
        'Last Name': 'Smith', Country: 'US', Affiliation: 'Uni',
        Email: 'john@example.com', 'Web page': ''
      }],
    };

    expect(() => validateConferenceData(data)).not.toThrow();
  });

  it('should throw on missing required field', () => {
    const data = {
      rooms: [{ Id: '', Name: 'Main Hall', Description: 'Large room' }],
      sessions: [],
      talks: [],
      authors: [],
      sessionChairs: [],
    };

    expect(() => validateConferenceData(data)).toThrow(ValidationError);
    expect(() => validateConferenceData(data)).toThrow('rooms.csv row 2: Id is required');
  });

  it('should throw on invalid date format', () => {
    const data = {
      rooms: [{ Id: 'ROOM-1', Name: 'Main Hall', Description: '' }],
      sessions: [{
        Id: 'SES-1', Number: '1', Title: 'Opening', Date: '15-06-2026',
        'Start time': '09:00', Duration: '60', Kind: 'plenary',
        Description: '', 'Room Id': 'ROOM-1', Chairs: 'Dr. Smith'
      }],
      talks: [],
      authors: [],
      sessionChairs: [],
    };

    expect(() => validateConferenceData(data)).toThrow(ValidationError);
    expect(() => validateConferenceData(data)).toThrow("sessions.csv row 2: 'Date' must be YYYY-MM-DD");
  });

  it('should throw on invalid time format', () => {
    const data = {
      rooms: [{ Id: 'ROOM-1', Name: 'Main Hall', Description: '' }],
      sessions: [{
        Id: 'SES-1', Number: '1', Title: 'Opening', Date: '2026-06-15',
        'Start time': '9:00 AM', Duration: '60', Kind: 'plenary',
        Description: '', 'Room Id': 'ROOM-1', Chairs: 'Dr. Smith'
      }],
      talks: [],
      authors: [],
      sessionChairs: [],
    };

    expect(() => validateConferenceData(data)).toThrow(ValidationError);
    expect(() => validateConferenceData(data)).toThrow("sessions.csv row 2: 'Start time' must be HH:MM");
  });

  it('should throw on invalid duration', () => {
    const data = {
      rooms: [{ Id: 'ROOM-1', Name: 'Main Hall', Description: '' }],
      sessions: [{
        Id: 'SES-1', Number: '1', Title: 'Opening', Date: '2026-06-15',
        'Start time': '09:00', Duration: 'abc', Kind: 'plenary',
        Description: '', 'Room Id': 'ROOM-1', Chairs: 'Dr. Smith'
      }],
      talks: [],
      authors: [],
      sessionChairs: [],
    };

    expect(() => validateConferenceData(data)).toThrow(ValidationError);
    expect(() => validateConferenceData(data)).toThrow('sessions.csv row 2: Duration must be a positive integer');
  });

  it('should throw on foreign key violation', () => {
    const data = {
      rooms: [{ Id: 'ROOM-1', Name: 'Main Hall', Description: '' }],
      sessions: [{
        Id: 'SES-1', Number: '1', Title: 'Opening', Date: '2026-06-15',
        'Start time': '09:00', Duration: '60', Kind: 'plenary',
        Description: '', 'Room Id': 'ROOM-1', Chairs: 'Dr. Smith'
      }],
      talks: [{
        Id: 'TALK-1', Number: '1', Title: 'Keynote', Date: '2026-06-15',
        'Start time': '09:00', Duration: '60', Abstract: '',
        Track: 'main', 'Session Id': 'NONEXISTENT', Authors: 'Dr. Smith'
      }],
      authors: [],
      sessionChairs: [],
    };

    expect(() => validateConferenceData(data)).toThrow(ValidationError);
    expect(() => validateConferenceData(data)).toThrow("talks.csv row 2: 'Session Id' NONEXISTENT does not exist in sessions");
  });
});
