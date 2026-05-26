CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS persons (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  country TEXT,
  affiliation TEXT,
  email TEXT,
  web_page TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_min INTEGER NOT NULL,
  kind TEXT NOT NULL,
  description TEXT,
  room_id TEXT REFERENCES rooms(id)
);

CREATE TABLE IF NOT EXISTS talks (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_min INTEGER NOT NULL,
  abstract TEXT,
  track TEXT,
  session_id TEXT REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS talk_authors (
  talk_id TEXT REFERENCES talks(id) ON DELETE CASCADE,
  person_id TEXT REFERENCES persons(id) ON DELETE CASCADE,
  is_presenter BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (talk_id, person_id)
);

CREATE TABLE IF NOT EXISTS session_chairs (
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  person_id TEXT REFERENCES persons(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, person_id)
);
