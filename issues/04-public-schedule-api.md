## Parent

Admin Portal feature for ICED26. See `docs/PRD.md`.

**GitHub Issue:** [#4](https://github.com/adalbertdb/iced26-app-portal/issues/4)

## What to build

Public read-only API that serves the full conference schedule as a single composite JSON response. This replaces the Flutter app's bundled offline JSON.

- **Endpoint:** `GET /api/schedule` — no auth required.
- **Query logic:** Raw SQL queries joining all normalized tables:
  - `SELECT ... FROM rooms`
  - `SELECT ... FROM sessions JOIN rooms ON ...`
  - `SELECT ... FROM talks JOIN sessions ON ...`
  - `SELECT ... FROM persons` (for speakers)
  - `SELECT ... FROM talk_authors JOIN persons ON ...`
  - `SELECT ... FROM session_chairs JOIN persons ON ...`
- **Response shape:** Assemble into JSON matching the Flutter app's current data model:
  ```json
  {
    "rooms": [...],
    "events": [...],
    "sessionBlocks": [...],
    "speakers": [...]
  }
  ```
  Where dates/times are ISO 8601 strings with `+02:00` offset (Salamanca CEST).
- **Data mapping:**
  - `rooms` → `Room` entity (id, name, description as capacity hint)
  - `sessions` + `talks` → `Event` entities (id, title, description, type, start/end, duration, room, speakers, etc.)
  - `sessions` → `SessionBlock` entities (id, parent references, room, track, title, times)
  - `persons` (authors + chairs) → `Speaker` entries within events
- **Integration test:** Seed the DB with known test data via upload endpoint, then assert `GET /api/schedule` returns expected JSON structure and values.

This endpoint is the contract between the portal and the Flutter app. Keep the shape stable.

## Acceptance criteria

- [ ] `GET /api/schedule` returns 200 with valid JSON.
- [ ] Response contains `rooms`, `events`, `sessionBlocks`, and `speakers` arrays.
- [ ] Events include correct room references, speaker lists, and time ranges.
- [ ] Dates/times include `+02:00` timezone offset.
- [ ] Integration test: after uploading a known zip, the API returns data matching the input.
- [ ] Public endpoint requires no authentication.

## Blocked by

- `01-bootstrap-portal-infrastructure.md`
- `03-csv-upload-with-validation.md`
