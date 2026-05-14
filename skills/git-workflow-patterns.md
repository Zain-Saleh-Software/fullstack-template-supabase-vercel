# Git & Workflow

> **Source of Truth:** This skill defines ALL Git and workflow rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).

---

## 14.1 Branching & Commits

- **Trunk-Based Development:** Feature branches MUST be short-lived (<3 days).
- **Conventional Commits:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- **Atomic Commits:** One logical change per commit. Do NOT mix formatting, refactoring, and feature changes.

---

## 14.2 Commit Messages

- Format: `type(scope): description`
- Examples:
  - `feat(auth): add password reset flow`
  - `fix(api): handle duplicate email gracefully`
  - `chore(deps): upgrade fastapi to 0.115.0`

---

## Pre-Push Hook

The pre-push hook (`.githooks/pre-push`) enforces:
1. `ruff check .` (backend lint)
2. `pytest` (backend tests)
3. `npm run lint` (frontend lint)
4. `npm test` (frontend tests)

ALL MUST pass before push succeeds.

## Commit Safety

- NEVER commit `.env` files, secrets, or credentials.
- Pre-commit hooks MUST block commits containing secrets or `.env` files.
