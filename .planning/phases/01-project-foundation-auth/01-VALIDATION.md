---
phase: 1
slug: project-foundation-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (latest) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `cd backend && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd backend && npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd backend && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | FR-1.1 | unit | `npx vitest run src/__tests__/auth.test.ts -t "register"` | No — W0 | pending |
| 1-01-02 | 01 | 1 | FR-1.2 | unit | `npx vitest run src/__tests__/auth.test.ts -t "login"` | No — W0 | pending |
| 1-01-03 | 01 | 1 | FR-1.3 | unit | `npx vitest run src/__tests__/middleware/auth.test.ts` | No — W0 | pending |
| 1-01-04 | 01 | 1 | FR-1.4 | unit | `npx vitest run src/__tests__/auth.test.ts -t "bcrypt"` | No — W0 | pending |
| 1-01-05 | 01 | 1 | FR-1.5 | unit | `npx vitest run src/__tests__/auth.test.ts -t "expiry"` | No — W0 | pending |
| 1-02-01 | 02 | 1 | FR-2.1 | unit | `npx vitest run src/__tests__/keys.test.ts -t "add"` | No — W0 | pending |
| 1-02-02 | 02 | 1 | FR-2.2 | unit | `npx vitest run src/__tests__/services/key-validator.test.ts` | No — W0 | pending |
| 1-02-03 | 02 | 1 | FR-2.3 | unit | `npx vitest run src/__tests__/services/key-manager.test.ts` | No — W0 | pending |
| 1-02-04 | 02 | 1 | FR-2.4 | unit | `npx vitest run src/__tests__/keys.test.ts -t "masked"` | No — W0 | pending |
| 1-02-05 | 02 | 1 | FR-2.6 | unit | `npx vitest run src/__tests__/keys.test.ts -t "delete"` | No — W0 | pending |
| 1-03-01 | 03 | 1 | NFR-2.4 | unit | `npx vitest run src/__tests__/middleware/validate.test.ts` | No — W0 | pending |
| 1-03-02 | 03 | 1 | NFR-2.6 | unit | `npx vitest run src/__tests__/middleware/cors.test.ts` | No — W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `backend/vitest.config.ts` — vitest configuration
- [ ] `backend/src/__tests__/auth.test.ts` — auth route test stubs
- [ ] `backend/src/__tests__/keys.test.ts` — key management route test stubs
- [ ] `backend/src/__tests__/services/key-manager.test.ts` — encryption unit test stubs
- [ ] `backend/src/__tests__/services/key-validator.test.ts` — validation unit test stubs (mocked HTTP)
- [ ] `backend/src/__tests__/middleware/auth.test.ts` — JWT middleware test stubs
- [ ] `backend/src/__tests__/middleware/validate.test.ts` — zod middleware test stubs
- [ ] Framework install: `npm install -D vitest @vitest/coverage-v8`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Settings page UI renders correctly | FR-2.1 | Visual rendering | Navigate to /settings, verify key input form renders |
| Login/register pages accessible | FR-1.1 | Visual rendering | Navigate to /login and /register |
| API key masked display | FR-2.4 | Visual verification | Add key, verify UI shows `sk-...xxxx` format |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
