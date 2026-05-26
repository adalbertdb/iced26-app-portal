import type postgres from 'postgres';

interface ConferenceData {
  rooms: Record<string, string>[];
  sessions: Record<string, string>[];
  talks: Record<string, string>[];
  authors: Record<string, string>[];
  sessionChairs: Record<string, string>[];
}

interface IngestionResult {
  rooms: number;
  sessions: number;
  talks: number;
  persons: number;
  talkAuthors: number;
  sessionChairs: number;
}

export async function ingestConferenceData(sql: postgres.Sql<{}>, data: ConferenceData): Promise<IngestionResult> {
  return await sql.begin(async (trx) => {
    // Clear existing data in reverse dependency order
    await trx`DELETE FROM session_chairs`;
    await trx`DELETE FROM talk_authors`;
    await trx`DELETE FROM talks`;
    await trx`DELETE FROM sessions`;
    await trx`DELETE FROM persons`;
    await trx`DELETE FROM rooms`;

    // Insert rooms
    for (const room of data.rooms) {
      await trx`
        INSERT INTO rooms (id, name, description)
        VALUES (${room.Id}, ${room.Name}, ${room.Description || null})
      `;
    }

    // Collect unique persons from authors and chairs
    const personsMap = new Map<string, Record<string, string>>();
    for (const author of data.authors) {
      personsMap.set(author['Person Id'], author);
    }
    for (const chair of data.sessionChairs) {
      personsMap.set(chair['Person Id'], chair);
    }

    // Insert persons
    for (const person of personsMap.values()) {
      await trx`
        INSERT INTO persons (id, first_name, last_name, country, affiliation, email, web_page)
        VALUES (
          ${person['Person Id']},
          ${person['First name']},
          ${person['Last name']},
          ${person['Country code'] || person['Country'] || null},
          ${person.Affiliation || null},
          ${person.Email || null},
          ${person['Web page'] || null}
        )
      `;
    }

    // Insert sessions
    for (const session of data.sessions) {
      await trx`
        INSERT INTO sessions (id, number, title, date, start_time, duration_min, kind, description, room_id)
        VALUES (
          ${session.Id},
          ${session.Number ? parseInt(session.Number, 10) : null},
          ${session.Title},
          ${session.Date},
          ${session['Start time']},
          ${parseInt(session.Duration, 10)},
          ${session.Kind},
          ${session.Description || null},
          ${session['Room Id'] || null}
        )
      `;
    }

    // Insert talks
    for (const talk of data.talks) {
      await trx`
        INSERT INTO talks (id, number, title, date, start_time, duration_min, abstract, track, session_id)
        VALUES (
          ${talk.Id},
          ${parseInt(talk.Number, 10)},
          ${talk.Title},
          ${talk.Date},
          ${talk['Start time']},
          ${parseInt(talk.Duration, 10)},
          ${talk.Abstract || null},
          ${talk.Track || null},
          ${talk['Session Id']}
        )
      `;
    }

    // Insert talk authors
    for (const author of data.authors) {
      await trx`
        INSERT INTO talk_authors (talk_id, person_id, is_presenter)
        VALUES (${author['Talk id']}, ${author['Person Id']}, ${author['Presenter?'] === 'yes'})
      `;
    }

    // Insert session chairs
    for (const chair of data.sessionChairs) {
      await trx`
        INSERT INTO session_chairs (session_id, person_id)
        VALUES (${chair['Session Id']}, ${chair['Person Id']})
      `;
    }

    return {
      rooms: data.rooms.length,
      sessions: data.sessions.length,
      talks: data.talks.length,
      persons: personsMap.size,
      talkAuthors: data.authors.length,
      sessionChairs: data.sessionChairs.length,
    };
  });
}
