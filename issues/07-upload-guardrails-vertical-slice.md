Status: ready-for-agent

## Parent

Security baseline scope for ICED26 portal. See [docs/PRD-security.md](../docs/PRD-security.md).

## What to build

Harden admin ZIP upload boundaries as a complete vertical slice.

This slice must include all layers:
- Backend request boundaries: multipart limits for request and file size.
- ZIP safety boundaries: reject malformed ZIPs, excessive entry count, path traversal patterns, and excessive extraction size.
- API contract: return actionable non-sensitive validation errors for blocked uploads.
- Frontend behavior: upload view surfaces boundary errors clearly without exposing internals.
- Data safety: failed uploads never mutate persisted conference dataset.
- Tests: TDD-first suite for valid ZIP, oversize payload, malformed archive, and suspicious archive patterns.

The slice is complete when malicious or malformed uploads fail safely, valid uploads still succeed, and all behaviors are test-proven.

## Acceptance criteria

- [ ] Upload endpoint enforces explicit multipart file/request limits.
- [ ] Malformed ZIP and suspicious ZIP structures are rejected before ingest.
- [ ] Oversized upload payloads return deterministic error responses.
- [ ] Failed uploads do not alter conference data in storage.
- [ ] Upload UI shows clear error states for boundary rejections.
- [ ] TDD tests cover valid path and all blocked boundary scenarios.

## Blocked by

- [issues/05-auth-baseline-hardening.md](05-auth-baseline-hardening.md)
