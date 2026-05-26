## Parent

Admin Portal feature for ICED26. See `docs/PRD.md`.

**GitHub Issue:** [#3](https://github.com/adalbertdb/iced26-app-portal/issues/3)

## What to build

The core feature: admins upload a zip of 5 CSVs, the system validates them strictly, and if valid, atomically replaces the conference dataset in Postgres.

- **Upload route:** `POST /admin/upload` (protected by JWT). Accepts multipart zip file via `@fastify/multipart`.
- **File handling:** Save zip to `/tmp/<uuid>/`, extract with a zip library (e.g., `adm-zip` or `node-stream-zip`).
- **CSV parsing:** Parse the 5 CSVs with a robust parser (`csv-parse` or `papaparse`) that handles quoted fields, multiline cells (HTML abstracts), and comma-separated values correctly.
- **Strict validator (fail-fast):** For every row in every file, validate:
  - Required fields present
  - `Date`: `YYYY-MM-DD` format
  - `Start time`: `HH:MM` format
  - `Duration`: positive integer
  - Foreign keys: `talks.Session Id` must exist in `sessions.csv`; `sessions.Room Id` must exist in `rooms.csv`
  - `Person Id` references must be consistent
  - On first failure, throw `ValidationError` with: file name, row number (1-indexed, including header), field name, reason
- **No DB touch on invalid data:** Validation runs entirely before any SQL. If validation fails, the temp directory is cleaned up and the endpoint returns the error.
- **Atomic ingestion:** If all rows pass, wrap in `BEGIN...COMMIT`:
  - `DELETE FROM session_chairs; DELETE FROM talk_authors; DELETE FROM talks; DELETE FROM sessions; DELETE FROM persons; DELETE FROM rooms;`
  - Then `INSERT` all new data in dependency order (rooms → persons → sessions → talks → junction tables)
- **Cleanup:** Delete `/tmp/<uuid>/` regardless of success or failure.
- **Response:** `{ success: true, message: "Imported X talks, Y sessions, Z rooms" }` or `{ success: false, error: "talks.csv row 42: 'Start time' must be HH:MM" }`
- **Frontend:** `UploadView.vue` with drag-and-drop zip upload. Shows spinner during processing. On success, displays confirmation message. On error, displays the structured error clearly (file, row, field, reason).
- **Tests:** Unit tests for the validator module covering valid rows, each invalid case, multiline HTML, and foreign key violations.

## Acceptance criteria

- [ ] Admin can upload a zip via drag-and-drop and see success confirmation.
- [ ] Uploading a zip with a malformed row returns a clear error without modifying the database.
- [ ] Uploading a zip with a foreign key violation (e.g., talk references non-existent session) returns a clear error.
- [ ] Atomic swap: if ingestion fails mid-transaction, previous conference data remains intact.
- [ ] Unit tests cover all validator cases.
- [ ] Temp files are cleaned up after every upload attempt.

## Blocked by

- `02-admin-authentication.md`
