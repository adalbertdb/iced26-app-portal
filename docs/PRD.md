# PRD: ICED26 Admin Portal

## Problem Statement

ICED26 conference schedule data is currently exported from the conference admin panel as 5 raw CSV files. Every time the schedule changes, someone has to manually parse these CSVs, transform them, and bundle them into the Flutter app's offline JSON file. This process is error-prone, slow, and requires an app store release for every schedule update. We need a web portal where ICED26 admins can upload the raw CSV zip export, have it validated and stored in a database, and expose the data via a public API so the Flutter app (and any future consumer) can fetch the latest schedule without manual intervention.

## Solution

A lightweight, monolithic web portal (`iced26-app-portal`) deployed on Railway/Render. It consists of:
- A Vue 3 frontend with Tailwind 4 for admin login and zip upload
- A Fastify backend with raw SQL (`postgres.js`) that handles authentication, CSV parsing, strict validation, atomic database swaps, and a public read API
- A Postgres database storing the normalized conference data

Admins log in, drag-and-drop a zip file containing the 5 CSVs, the backend validates every row strictly, and if valid, atomically replaces the existing conference dataset. The Flutter app can then fetch the full schedule from a single public endpoint.

## User Stories

1. As an ICED26 admin, I want to log in to the portal with a username and password, so that unauthorized users cannot access the upload functionality.
2. As an ICED26 admin, I want to upload a zip file containing the 5 conference CSVs, so that the latest schedule data is available to the app.
3. As an ICED26 admin, I want to see a clear error message if the uploaded CSVs contain invalid data, so that I can fix the source data and re-upload.
4. As an ICED26 admin, I want the upload to be atomic (all or nothing), so that the API never serves a partially imported or corrupt dataset.
5. As an ICED26 admin, I want the portal to tell me when the upload succeeded and what changed, so that I have confidence the data is live.
6. As a Flutter app user, I want to fetch the complete conference schedule from a single public API endpoint, so that the app can stay up to date without a new app store release.
7. As a developer, I want the backend to initialize its own database schema on boot, so that no manual migration steps are required on deploy.
8. As a developer, I want a CLI script to seed the first admin user, so that there is a secure way to create the initial login credentials.
9. As a developer, I want the frontend and backend served from the same deployed service, so that there is no CORS complexity or separate frontend hosting.
10. As an ICED26 admin, I want the upload UI to show upload progress and validation status, so that I know the system is working on large files.
11. As a developer, I want the API to return the schedule data in a shape close to the current offline JSON structure, so that the Flutter team has minimal migration work.
12. As an ICED26 admin, I want the portal UI to be simple and minimal (just login + upload), so that there is no learning curve.
13. As a developer, I want the backend to log validation errors with file name and row number, so that debugging failed uploads is straightforward.
14. As a developer, I want the system to store persons (authors and chairs) in a single normalized table, so that the same individual appearing in multiple roles is represented once.
15. As an ICED26 admin, I want the system to handle CSV edge cases gracefully (multiline fields, HTML in abstracts, comma-separated author strings), so that raw exports from the admin panel work without manual cleanup.

## Implementation Decisions

### Modules to Build

1. **Auth Module** (`auth/`) — JWT sign/verify utilities, bcrypt password hashing. Exposes `signToken(userId)` and `verifyToken(token)`. Used by login route and as a Fastify preHandler on protected routes.

2. **Database Client** (`db/`) — `postgres.js` pool configuration, schema initialization from `schema.sql`. Exposes a query helper and runs `CREATE TABLE IF NOT EXISTS` on every server boot.

3. **CSV Parser & Validator** (`csv/`) — Deep module encapsulating all CSV logic:
   - Unzip uploaded file to `/tmp`, extract 5 CSVs.
   - Stream-parse each CSV row.
   - Strict validation: required fields, date formats (`YYYY-MM-DD`), time formats (`HH:MM`), integer durations, foreign key integrity (e.g., `talks.Session Id` must exist in `sessions.csv`, `sessions.Room Id` must exist in `rooms.csv`), and valid `Person Id` references.
   - Fail-fast on first invalid row: throw `ValidationError` with file name, row number, field name, and reason.
   - Return structured arrays of parsed objects ready for SQL insertion.

4. **Data Ingestion Service** (`ingestion/`) — Orchestrates the atomic swap:
   - Wraps `BEGIN...COMMIT` transaction around: delete all conference data (`session_chairs`, `talk_authors`, `talks`, `sessions`, `persons`, `rooms`), then insert new parsed data.
   - On any error (validation or DB), rolls back and returns error details to the upload route.

5. **Public API Module** (`routes/api.ts`) — Single composite endpoint `GET /api/schedule` that queries all normalized tables, joins/assembles the response into a JSON shape matching the Flutter app's needs.

6. **Admin API Module** (`routes/admin.ts`) — `POST /admin/login` (returns JWT), `POST /admin/upload` (accepts multipart zip, runs parser + ingestion, returns success or validation error).

7. **Static File Serving** — Fastify `@fastify/static` serves the Vue build output from `frontend/dist/` at root path `/`.

8. **Vue Frontend**
   - `LoginView.vue` — username/password form, calls `/admin/login`, stores JWT in Pinia + localStorage.
   - `UploadView.vue` — drag-and-drop zip upload, shows progress/spinner, displays server validation errors or success message.
   - Pinia `auth.ts` store manages login state and JWT.

9. **Seed CLI** — `scripts/seed-admin.ts` or `seed-admin.js` invoked via `npm run seed:admin`. Prompts for (or reads env vars for) username and password, hashes with bcrypt, inserts into `users` table.

### Schema Design

Normalized tables:
- `users` — `id`, `username` (unique), `password_hash`, `created_at`
- `rooms` — `id` (PK, from CSV), `name`, `description`
- `persons` — `id` (PK, from CSV `Person Id`), `first_name`, `last_name`, `country`, `affiliation`, `email`, `web_page`
- `sessions` — `id` (PK, from CSV), `number`, `title`, `date`, `start_time`, `duration_min`, `kind`, `description`, `room_id` (FK → rooms)
- `talks` — `id` (PK, from CSV), `number`, `title`, `date`, `start_time`, `duration_min`, `abstract`, `track`, `session_id` (FK → sessions)
- `talk_authors` — junction: `talk_id` (FK), `person_id` (FK), `is_presenter` (boolean)
- `session_chairs` — junction: `session_id` (FK), `person_id` (FK)

### API Contracts

- `POST /admin/login` → `{ username, password }` / `{ token }`
- `POST /admin/upload` → multipart `file` (zip) / `{ success: true, message }` or `{ success: false, error: "talks.csv row 42: 'Start time' must be HH:MM" }`
- `GET /api/schedule` → `{ rooms: [...], events: [...], sessionBlocks: [...], speakers: [...] }` (shape derived from Flutter app entities)

### Hosting

Monolithic deploy on Railway/Render. One service, one URL. `Dockerfile` for Fastify + static frontend. Postgres connection string via `DATABASE_URL` env var. `PORT` env var for server port.

## Testing Decisions

- **CSV Validator** is the most critical deep module and MUST be unit-tested extensively. Test: valid rows pass, each invalid field type fails with correct error message, foreign key violations are caught, multiline HTML abstracts parse correctly, comma-separated author strings are handled.
- **Auth Module** — test JWT sign/verify, bcrypt hashing, and the preHandler middleware rejecting missing/invalid tokens.
- **Ingestion Service** — test the atomic swap using an in-memory or test Postgres instance. Assert that partial failures roll back and leave previous data intact.
- **Public API** — test `GET /api/schedule` returns correct JSON shape and includes all expected data after a successful upload.
- **Frontend** — minimal testing required for a 2-page admin tool. If tested, use Vitest for Pinia store logic only.

Good tests exercise external behavior ("given these CSVs, the API returns these events") rather than implementation details ("the parser calls `parseInt`").

## Out of Scope

- Flutter app changes to consume the API (explicitly out of scope per user).
- Incremental/diff-based updates (atomic full replacement only).
- Admin user management UI (only one admin, seeded via CLI).
- File storage beyond `/tmp` (no S3/R2).
- Rate limiting, caching layers, or CDN (Railway/Render handles basic TLS and scaling).
- Email notifications, password reset, or OAuth.
- GraphQL or multiple REST resource endpoints.
- ETag/versioning for the Flutter sync check (app fetches full dataset every time).

## Implementation Plan

Issues are tracked in **two places**: local markdown files (`iced26-app-portal/issues/`) and GitHub Issues (`adalbertdb/iced26-app-portal`).

| # | Local Issue | GitHub Issue | Description | Blocked by |
|---|-------------|--------------|-------------|------------|
| 1 | `issues/01-bootstrap-portal-infrastructure.md` | [#1](https://github.com/adalbertdb/iced26-app-portal/issues/1) | Bootstrap Fastify + Vue + Postgres + Docker Compose | — |
| 2 | `issues/02-admin-authentication.md` | [#2](https://github.com/adalbertdb/iced26-app-portal/issues/2) | JWT auth, login route, seed CLI, Vue login view | #1 |
| 3 | `issues/03-csv-upload-with-validation.md` | [#3](https://github.com/adalbertdb/iced26-app-portal/issues/3) | Upload zip, strict CSV validation, atomic ingestion | #2 |
| 4 | `issues/04-public-schedule-api.md` | [#4](https://github.com/adalbertdb/iced26-app-portal/issues/4) | `GET /api/schedule` composite endpoint | #1, #3 |

Each issue is implemented on a `feat/<issue-number>-<slug>` branch, pushed to GitHub, and reviewed via PR before merge.

## Further Notes

- The CSV files contain HTML in abstracts and multiline fields. The parser must handle standard CSV quoting rules correctly. Consider `csv-parse` or `papaparse` libraries.
- `talks.csv` has an `Authors` column that is a human-readable comma-separated string. The canonical author data is in `authors.csv` linked by `Talk id`. The validator should probably ignore the `Authors` string and use the structured `authors.csv` data, or at least cross-check them.
- `sessions.csv` has a `Chairs` string column and a separate `session_chairs.csv`. Same pattern: use the structured file as the source of truth.
- Since the same `Person Id` can appear as an author and a chair, the normalized `persons` table deduplicates them naturally.
- Timezone handling: the CSV dates/times are local to Salamanca, Spain (CEST, UTC+2 during the conference). The API should probably emit ISO 8601 strings with `+02:00` offset to match the current Flutter JSON.
