Status: ready-for-agent

## Parent

Security baseline scope for ICED26 portal. See [docs/PRD-security.md](../docs/PRD-security.md).

## What to build

Deliver an end-to-end authentication baseline hardening slice.

This slice must include all layers:
- Backend config behavior: startup fails if JWT secret is missing; runtime has no fallback secret.
- Admin bootstrap UX: seed command must require explicit username/password (no implicit admin/admin path).
- API behavior: login still returns token for valid credentials and 401 for invalid credentials.
- Operator docs: short runbook update for secure secret generation and seed usage.
- Tests: complete TDD cycle for boot guard, seed guardrails, and login happy/fail paths.

The slice is complete only if a fresh operator can follow docs, seed admin safely, and log in without insecure defaults.

## Acceptance criteria

- [ ] Boot process fails with a clear error when JWT secret is absent.
- [ ] JWT code path contains no runtime fallback secret.
- [ ] Seed admin requires explicit credentials and rejects missing args.
- [ ] Login flow remains functional for valid credentials and rejects invalid ones.
- [ ] TDD tests cover boot guard, seed guard, and login behavior.
- [ ] Documentation includes secure seed and secret setup steps.

## Blocked by

- [issues/01-bootstrap-portal-infrastructure.md](01-bootstrap-portal-infrastructure.md)
