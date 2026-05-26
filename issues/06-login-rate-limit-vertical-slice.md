Status: ready-for-agent

## Parent

Security baseline scope for ICED26 portal. See [docs/PRD-security.md](../docs/PRD-security.md).

## What to build

Add brute-force protection to admin login as a full vertical slice.

This slice must include all layers:
- Backend protection: deterministic per-IP login rate limit with configurable threshold/window.
- API contract: when threshold is exceeded, endpoint returns 429 with stable error payload.
- Frontend behavior: login view displays a clear throttling message and allows retry after cooldown.
- Observability: blocked attempts are logged without leaking password values.
- Tests: TDD-first tests for threshold crossing, cooldown recovery, and unchanged normal login behavior.

The slice is complete when a brute-force sequence is blocked, user feedback is clear, and tests prove recovery and non-regression.

## Acceptance criteria

- [ ] Repeated failed login attempts trigger rate limiting on configured threshold.
- [ ] Login endpoint returns 429 with predictable response shape during throttle period.
- [ ] Login view shows a specific and user-friendly throttling error state.
- [ ] Normal login path still works when under threshold.
- [ ] Logs capture throttled events with non-sensitive context.
- [ ] TDD tests cover fail-until-429, cooldown window, and success path regression.

## Blocked by

- [issues/05-auth-baseline-hardening.md](05-auth-baseline-hardening.md)
