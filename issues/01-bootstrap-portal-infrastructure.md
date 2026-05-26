## Parent

Admin Portal feature for ICED26. See `docs/PRD.md`.

**GitHub Issue:** [#1](https://github.com/adalbertdb/iced26-app-portal/issues/1)

## What to build

Bootstrap the `iced26-app-portal` repository with the full development and deployment stack. This slice delivers a runnable skeleton — not business logic yet, but the foundation everything else builds on.

- **Backend:** Fastify server (Node.js, ts , raw SQL via `postgres.js`) with a health check endpoint (`GET /health` → `{ status: "ok" }`).
- **Database:** `schema.sql` that creates all tables on boot (`CREATE TABLE IF NOT EXISTS`): `users`, `rooms`, `persons`, `sessions`, `talks`, `talk_authors`, `session_chairs`.
- **Frontend:** Vite + Vue 3 + Tailwind 4 project. Single `App.vue` that renders "ICED26 Portal".
- **Integration:** Fastify `@fastify/static` serves the Vue `dist/` build at root path `/`.
- **Local dev database:** `docker-compose.yml` with a Postgres service (port 5432, default credentials) for local development. The Fastify backend connects via `DATABASE_URL` env var.
- **Deploy:** The monolithic service will be deployed to Railway/Render (out of scope for this slice). For local dev, run backend with `npm run dev` and frontend with Vite dev server separately.

On boot, the server runs `schema.sql` against `DATABASE_URL`. No manual migration step needed.

## Acceptance criteria

- [ ] `docker-compose up` starts a local Postgres on port 5432.
- [ ] `GET /health` returns JSON `{ status: "ok" }`.
- [ ] `GET /` serves the Vue app and displays "ICED26 Portal".
- [ ] `schema.sql` creates all 7 tables idempotently on server startup.
- [ ] `README.md` documents: `docker-compose up`, `npm run dev` (backend), `npm run dev` (frontend), and `npm run build`.

## Blocked by

None - can start immediately.
