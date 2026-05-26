## Parent

Admin Portal feature for ICED26. See `docs/PRD.md`.

**GitHub Issue:** [#2](https://github.com/adalbertdb/iced26-app-portal/issues/2)

## What to build

Add authentication so only conference admins can access the upload functionality.

- **Backend:** JWT module (`signToken`, `verifyToken`) using a library like `fastify-jwt` or hand-rolled with `jsonwebtoken`. Bcrypt password hashing with `bcryptjs` or `bcrypt`. `POST /admin/login` accepts `{ username, password }`, verifies against `users` table, returns `{ token }`. Fastify preHandler on protected routes rejects missing/invalid tokens with 401.
- **Database:** `users` table (already in schema from Slice 1) with `id`, `username` (unique), `password_hash`, `created_at`.
- **CLI:** `npm run seed:admin` script that prompts for username and password (or reads from env vars), hashes with bcrypt, inserts into `users`. Run once after first deploy.
- **Frontend:** `LoginView.vue` with username/password form. On success, stores JWT in Pinia auth store + `localStorage`. Redirects to upload view.
- **Auth state:** Pinia `auth.ts` store manages `token`, `isAuthenticated`, and `login/logout` actions. `App.vue` or router guards redirect unauthenticated users to login.

After login, the user sees the upload view (or a placeholder link if upload view isn't built yet).

## Acceptance criteria

- [ ] `POST /admin/login` returns JWT for valid credentials, 401 for invalid.
- [ ] Protected route (e.g., `GET /admin/protected-test`) returns 401 without token, 200 with valid token.
- [ ] `npm run seed:admin` creates a user in the database.
- [ ] Vue login form submits to backend and stores token in Pinia + localStorage.
- [ ] Unauthenticated users are redirected to login page.
- [ ] Logout clears token and redirects to login.

## Blocked by

- `01-bootstrap-portal-infrastructure.md`
