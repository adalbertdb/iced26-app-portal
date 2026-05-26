# PRD: Security Baseline (Recortado) for ICED26 Admin Portal

## Problem Statement

The portal is small, but it has two high-risk surfaces exposed to the internet:
- Admin authentication.
- Admin ZIP upload.

Current implementation leaves avoidable risks open (token forgery fallback, brute force, weak upload boundaries, public PII overexposure, known vulnerable dependency). This PRD defines a pragmatic baseline without overengineering.

## Product Goal

Ship the minimum security baseline required for safe production operation of a small admin portal and public schedule API.

## Security Scope

### Phase 1 (Must Have, AFK-friendly)

1. Mandatory JWT secret (no fallback default).
2. Seed admin without default credentials.
3. Login rate limit with deterministic behavior.
4. ZIP upload boundaries (request/file/extraction limits + malformed ZIP rejection).
5. Public API data minimization (remove email by default).
6. Runtime dependency remediation for known static-serving CVEs.

### Phase 2 (Can Wait)

1. Session migration from local storage token to HttpOnly cookie + CSRF.
2. CSP tightening and advanced header policy.
3. Progressive lockout policy and richer security telemetry.

## Non-Goals

- Enterprise IAM/SSO.
- Compliance framework rollout.
- WAF/SIEM programs.
- Full auth architecture rewrite.

## User Stories Covered in This PRD

1. As an admin, I need secrets enforced at boot so forged tokens are not possible from defaults.
2. As an operator, I need brute-force resistance on login to reduce account takeover risk.
3. As an admin, I need resilient upload boundaries so malicious ZIP files cannot degrade service.
4. As a participant, I need public schedule endpoints to expose only minimum personal data.
5. As an operator, I need vulnerable runtime dependencies removed from known CVE ranges.

## Functional Requirements (Phase 1)

### FR-1 Authentication baseline

- App startup fails when JWT secret is missing.
- Runtime code contains no default JWT fallback.
- Seed script rejects missing username/password arguments.

### FR-2 Login abuse protection

- Login endpoint enforces per-IP rate limit.
- Exceeded limit returns 429 with stable API contract.
- Behavior is covered by integration tests.

### FR-3 Upload guardrails

- Multipart request/file size limits are enforced.
- ZIP files with suspicious structure or over-limit extraction are rejected.
- Validation errors remain actionable and non-sensitive.

### FR-4 Public API privacy baseline

- Public schedule API does not return speaker email by default.
- Remaining speaker fields stay stable for app consumers.

### FR-5 Dependency hygiene

- Runtime dependency set must not include known vulnerable range for current @fastify/static advisories.
- Static serving and route behavior stays verified via tests.

## Acceptance Criteria

- [ ] Boot fails without JWT secret.
- [ ] Seed admin script no longer permits default admin/admin path.
- [ ] Login returns 429 after configured threshold in tests.
- [ ] Upload route rejects oversized or malformed ZIP payloads in tests.
- [ ] Public schedule response excludes speaker email field.
- [ ] @fastify/static upgraded beyond vulnerable range and regression-tested.

## Test Strategy (TDD-oriented)

- Unit tests:
  - Secret config guard.
  - Upload ZIP boundary validator.

- Integration tests:
  - Login success/failure/rate-limit path.
  - Upload valid ZIP and blocked ZIP scenarios.
  - Public API schema contract excluding email.
  - Static file serving still works after dependency upgrade.

## Delivery Model

Security work is split into thin vertical slices, each independently demoable and testable end-to-end, so AFK agents can execute with /tdd and verify completion from tests.

## Vertical Slice Mapping (Phase 1)

1. Slice 05: Auth baseline hardening (secret enforcement + seed safety + auth flow tests).
2. Slice 06: Login abuse controls (rate limit + frontend UX for 429 + integration tests).
3. Slice 07: Upload guardrails (multipart/ZIP boundaries + user-facing errors + tests).
4. Slice 08: Public API privacy and dependency CVE remediation (schema minimization + static regression tests).
