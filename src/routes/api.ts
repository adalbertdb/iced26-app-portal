import type { FastifyInstance } from 'fastify';
import type postgres from 'postgres';

export async function registerApiRoutes(app: FastifyInstance, sql: postgres.Sql<{}>) {
  app.get('/api/schedule', async () => {
    const rooms = await sql`
      SELECT id, name, description
      FROM rooms
      ORDER BY name
    `;

    const persons = await sql`
      SELECT id, first_name, last_name, country, affiliation, email, web_page
      FROM persons
      ORDER BY last_name, first_name
    `;

    const sessions = await sql`
      SELECT
        s.id, s.number, s.title, s.date, s.start_time, s.duration_min,
        s.kind, s.description, s.room_id,
        r.name as room_name
      FROM sessions s
      JOIN rooms r ON r.id = s.room_id
      ORDER BY s.date, s.start_time, s.number
    `;

    const talks = await sql`
      SELECT
        t.id, t.number, t.title, t.date, t.start_time, t.duration_min,
        t.abstract, t.track, t.session_id
      FROM talks t
      ORDER BY t.date, t.start_time, t.number
    `;

    const talkAuthors = await sql`
      SELECT ta.talk_id, ta.person_id, ta.is_presenter
      FROM talk_authors ta
    `;

    const sessionChairs = await sql`
      SELECT sc.session_id, sc.person_id
      FROM session_chairs sc
    `;

    // Build speakers list (unique persons who are authors or chairs)
    const speakerIds = new Set<string>();
    for (const ta of talkAuthors) {
      speakerIds.add(ta.person_id);
    }
    for (const sc of sessionChairs) {
      speakerIds.add(sc.person_id);
    }

    const speakers = persons
      .filter((p: any) => speakerIds.has(p.id))
      .map((p: any) => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        country: p.country,
        affiliation: p.affiliation,
        email: p.email,
        webPage: p.web_page,
      }));

    // Build session blocks
    const sessionBlocks = sessions.map((s: any) => {
      const chairs = sessionChairs
        .filter((sc: any) => sc.session_id === s.id)
        .map((sc: any) => sc.person_id);

      return {
        id: s.id,
        number: s.number,
        title: s.title,
        date: toIsoDate(s.date),
        startTime: `${toIsoDate(s.date)}T${toHhMm(s.start_time)}:00`,
        endTime: computeEndTime(s.date, s.start_time, s.duration_min),
        duration: s.duration_min,
        kind: s.kind,
        description: s.description,
        roomId: s.room_id,
        roomName: s.room_name,
        chairs,
      };
    });

    // Build events (talks + sessions as events)
    const events = [
      ...talks.map((t: any) => {
        const authors = talkAuthors
          .filter((ta: any) => ta.talk_id === t.id)
          .map((ta: any) => ({
            personId: ta.person_id,
            isPresenter: ta.is_presenter,
          }));

        return {
          id: t.id,
          number: t.number,
          title: t.title,
          date: toIsoDate(t.date),
          start: `${toIsoDate(t.date)}T${toHhMm(t.start_time)}:00`,
          end: computeEndTime(t.date, t.start_time, t.duration_min),
          duration: t.duration_min,
          abstract: t.abstract,
          track: t.track,
          sessionId: t.session_id,
          authors,
        };
      }),
      ...sessions.map((s: any) => ({
        id: s.id,
        number: s.number,
        title: s.title,
        date: toIsoDate(s.date),
        start: `${toIsoDate(s.date)}T${toHhMm(s.start_time)}:00`,
        end: computeEndTime(s.date, s.start_time, s.duration_min),
        duration: s.duration_min,
        kind: s.kind,
        description: s.description,
        roomId: s.room_id,
        roomName: s.room_name,
        isSession: true,
      })),
    ];

    return {
      rooms: rooms.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
      })),
      events,
      sessionBlocks,
      speakers,
    };
  });
}

function toIsoDate(d: Date | string): string {
  if (typeof d === 'string') return d;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toHhMm(time: Date | string): string {
  if (typeof time === 'string') {
    // "09:00" or "09:00:00" → "09:00"
    return time.slice(0, 5);
  }
  // Date object from postgres TIME column
  const h = String(time.getHours()).padStart(2, '0');
  const m = String(time.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function computeEndTime(date: Date | string, time: Date | string, durationMin: number): string {
  const isoDate = toIsoDate(date);
  const [hours, minutes] = toHhMm(time).split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMin;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  return `${isoDate}T${endTime}:00`;
}
