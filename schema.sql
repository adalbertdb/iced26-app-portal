CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS persons (
    id INTEGER PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    country VARCHAR(255),
    affiliation TEXT,
    email VARCHAR(255),
    web_page TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    number VARCHAR(50),
    title VARCHAR(500),
    date DATE,
    start_time TIME,
    duration_min INTEGER,
    kind VARCHAR(50),
    description TEXT,
    room_id INTEGER REFERENCES rooms(id)
);

CREATE TABLE IF NOT EXISTS talks (
    id INTEGER PRIMARY KEY,
    number VARCHAR(50),
    title VARCHAR(500),
    date DATE,
    start_time TIME,
    duration_min INTEGER,
    abstract TEXT,
    track VARCHAR(255),
    session_id INTEGER REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS talk_authors (
    talk_id INTEGER REFERENCES talks(id),
    person_id INTEGER REFERENCES persons(id),
    is_presenter BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (talk_id, person_id)
);

CREATE TABLE IF NOT EXISTS session_chairs (
    session_id INTEGER REFERENCES sessions(id),
    person_id INTEGER REFERENCES persons(id),
    PRIMARY KEY (session_id, person_id)
);
