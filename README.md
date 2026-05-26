# ICED26 Admin Portal

Monolithic web portal for ICED26 conference schedule management.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose

## Getting Started

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Start the local database:
   ```bash
   docker-compose up -d
   ```

3. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install
   ```

4. Run the backend in development mode:
   ```bash
   npm run dev
   ```

5. Run the frontend development server (in a separate terminal):
   ```bash
   cd frontend && npm run dev
   ```

6. Build the frontend for production:
   ```bash
   cd frontend && npm run build
   ```

The backend serves the built frontend at `http://localhost:3000/` and exposes the API on the same port.

## Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run backend with hot reload (tsx watch) |
| `npm run start` | Run compiled backend |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run seed:admin` | Seed the first admin user |
| `cd frontend && npm run dev` | Run Vite dev server |
| `cd frontend && npm run build` | Build Vue app to `dist/` |

## Architecture

- **Backend:** Fastify (TypeScript) + postgres.js
- **Frontend:** Vue 3 + Vite + Tailwind CSS 4
- **Database:** Postgres (schema auto-initializes on server boot)
- **Deployment:** Monolithic (Railway/Render), frontend served as static files via `@fastify/static`
