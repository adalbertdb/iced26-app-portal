# iced26-app-portal

ICED26 Admin Portal — Node.js + Fastify backend, Vue 3 + Vite frontend, Postgres database.

## Prerequisites

- Node.js
- Docker & Docker Compose

## Development Workflow

1. **Start the database**
   ```bash
   docker-compose up -d
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Run the backend in dev mode**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3000`.
   - `GET /health` returns `{ status: "ok" }`
   - Static frontend files are served from `dist/` at `/`

4. **Run the frontend in dev mode**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Build frontend for production**
   ```bash
   cd frontend
   npm run build
   ```
   This outputs to `../dist/`, which the Fastify backend serves.

## Project Structure

- `server.js` — Fastify server
- `schema.sql` — Database schema
- `docker-compose.yml` — Postgres container
- `frontend/` — Vue 3 + Vite + Tailwind CSS v4 app
- `dist/` — Production frontend build output
