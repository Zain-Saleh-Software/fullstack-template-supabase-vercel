# Template Governance Review Report

## Executive Summary

Your template has a **strong conceptual foundation** — three-agent mental model, council system, strict stack, phased bootstrap. But it has **critical contradictions and dangerous gaps** that would cause AI agents to make mistakes on real projects. Every issue below is fixed in the accompanying files.

---

## Critical Issues (Fix Immediately)

### 1. FATAL: Branch Strategy Contradiction
**CLAUDE.md says:** Always push to `develop`, never `main`.
**ci-cd.yml says:** Only runs on `main`/`master` — `develop` is never tested.

**Result:** An AI diligently pushes to `develop` per CLAUDE.md. Nothing runs. Code never gets tested, staged, or deployed. The whole CI/CD system is effectively dead for day-to-day work.

**Fix:** ci-cd.yml now runs on `develop` (for staging preview), `main` (for production). Pre-push hook now blocks direct pushes to `main`.

---

### 2. FATAL: Missing Skill Files Referenced in BMAD Councils
The BMAD `bmad-council-fe` skill references `skills/frontend-patterns.md` and `skills/preloading-patterns.md`. These files **don't exist**. The `skills/` directory has exactly ONE file. The entire council system is pointing to phantom skill files.

**Fix:** 8 new skill files created covering every technical domain.

---

### 3. CRITICAL: Two Disconnected Council Systems
You have **two separate, competing council systems** with no connection:
- `/councils/` — Custom councils (architect, security, quality, deployment)
- `.agents/skills/bmad-council-*/` — BMAD councils (db, be, fe, api, ci, dx, tq, gh, align, lead)

CLAUDE.md defines the custom councils inline (not referencing the files). The BMAD councils exist but are never invoked by CLAUDE.md. The custom councils duplicate the BMAD councils but are less detailed.

**Fix:** CLAUDE.md now references `/councils/` files explicitly. A new `councils/lead.md` orchestrates all councils. Custom councils are the canonical system; BMAD councils remain as extended reference skills.

---

### 4. CRITICAL: `.agents/` and `.claude/` Are 100% Identical Duplicates
Every single file in `.agents/skills/` exists verbatim in `.claude/skills/`. ~250 files duplicated. This is confusing and creates maintenance hell.

**Action Required (manual):** These exist because Claude Code reads `.claude/` and some other agent runners read `.agents/`. Keep BOTH directories but do NOT maintain two copies manually. Use a symlink or a setup script that copies `.claude/skills/` → `.agents/skills/` at bootstrap. Add a note to `CLAUDE.md` explaining this.

---

### 5. CRITICAL: Pre-Commit Hook Has Wrong Immutable Patterns
```bash
# Current (wrong):
IMMUTABLE_PATTERNS="^skills/|^RULES\.md$|^CLAUDE\.md$|^scripts/validate-rules\.sh$"

# Problem: doesn't protect .agents/, .claude/, councils/
# Also: the skills/ directory is WHERE NEW SKILLS ARE ADDED — it shouldn't be immutable
```

**Fix:** Immutable patterns now correctly protect `.agents/`, `.claude/`, `RULES.md`, `CLAUDE.md`. The `skills/` and `councils/` directories are NOT immutable — they're project infrastructure that evolves.

---

## Major Issues (Fix Before Use)

### 6. Pre-Push Hook Doesn't Block Pushes to `main`
Anyone (including an AI agent) can push directly to `main`. No protection.
**Fix:** pre-push now detects the target branch and blocks pushes to `main`/`master`.

### 7. Pre-Push and Pre-Commit Don't Run Type Check
TypeScript errors are not caught until CI. Should fail fast locally.
**Fix:** Both hooks now run `npm run typecheck` (or `tsc --noEmit`).

### 8. No Dedicated Testing Council/Skill
Testing rules are buried inside the Quality Council. E2E testing gets one line. There's no skill explaining HOW to write tests for this specific stack.
**Fix:** `skills/testing.md` created. Quality Council now has a dedicated Testing section.

### 9. No Observability Council
Sentry, structured logging, and Vercel Analytics are mentioned in RULES.md but never reviewed by a council. No skill exists for how to implement them correctly.
**Fix:** `councils/observability.md` and `skills/observability.md` created.

### 10. No Environment Management Skill
How to manage `.env.local`, `.env.example`, Vercel environment variables, and validate required vars at startup is not documented anywhere.
**Fix:** `skills/environment.md` created.

---

## Moderate Issues

### 11. RULES.md Missing Critical Sections
- No i18n rules beyond "use next-intl"
- No accessibility (a11y) rules
- No performance rules
- No component architecture conventions
- Confusingly worded secret rule: "Storing secrets in environment variables without `NEXT_PUBLIC_` prefix in client components" (this is backwards — the rule is the OPPOSITE)

### 12. CLAUDE.md Council Definitions Are Inline
The four council descriptions in CLAUDE.md duplicate the `/councils/` files. Agents have to read the same thing in two places.

### 13. No Session-Start Protocol
When an AI starts a new session on an existing project, it has no protocol for reading the current state (branch, last commit, pending tests). It could make changes without understanding context.

### 14. CI/CD Missing Steps
- No `tsc --noEmit` type check step
- No coverage threshold enforcement
- No separate staging vs. production environment logic
- No Sentry release step
- No database migration step

### 15. Dependabot Ignores Are Wrong
Ignoring React ≥19 and React-DOM ≥19 when the template requires React 19. These ignores prevent patch/security updates within React 19.

---

## File Change Summary

| File | Action | Priority |
|------|--------|----------|
| `CLAUDE.md` | **Rewrite** | Critical |
| `RULES.md` | **Expand** | Critical |
| `.github/workflows/ci-cd.yml` | **Rewrite** | Critical |
| `.githooks/pre-commit` | **Fix** | Critical |
| `.githooks/pre-push` | **Fix** | Critical |
| `skills/ai-init-project.md` | **Update** | High |
| `skills/database.md` | **New** | High |
| `skills/api-design.md` | **New** | High |
| `skills/auth-rbac.md` | **New** | High |
| `skills/frontend.md` | **New** | High |
| `skills/testing.md` | **New** | High |
| `skills/observability.md` | **New** | High |
| `skills/environment.md` | **New** | High |
| `skills/i18n.md` | **New** | Medium |
| `councils/lead.md` | **New** | High |
| `councils/architect.md` | **Update** | Medium |
| `councils/security.md` | **Update** | Medium |
| `councils/quality.md` | **Update** | Medium |
| `councils/deployment.md` | **Update** | Medium |
| `councils/observability.md` | **New** | Medium |
| `.github/dependabot.yml` | **Fix** | Low |

---

## Architecture of the Governing System (After Fix)

```
CLAUDE.md                    ← Master AI mandate. Read this first. Always.
RULES.md                     ← Immutable law. The "what". Never skip.
│
├── skills/                  ← Implementation guides. The "how".
│   ├── ai-init-project.md   ← Bootstrap protocol
│   ├── database.md          ← Drizzle, schemas, migrations, RLS
│   ├── api-design.md        ← API routes, responses, pagination
│   ├── auth-rbac.md         ← Supabase auth, RBAC engine, middleware
│   ├── frontend.md          ← Components, Tailwind v4, dark mode
│   ├── testing.md           ← Unit, integration, E2E patterns
│   ├── observability.md     ← Logger, Sentry, analytics
│   ├── environment.md       ← Env vars, secrets, validation
│   └── i18n.md              ← next-intl, translations, locale routing
│
├── councils/                ← Review & approval system. The "guard".
│   ├── lead.md              ← Orchestrates all councils
│   ├── architect.md         ← Architecture compliance
│   ├── security.md          ← Security review
│   ├── quality.md           ← Code quality + testing
│   ├── deployment.md        ← Vercel + Supabase deployment
│   └── observability.md     ← Logging, Sentry, analytics review
│
├── .github/workflows/
│   └── ci-cd.yml            ← CI on develop, CD to staging/production
│
└── .githooks/
    ├── pre-commit           ← Fast checks: secrets, lint, immutables
    └── pre-push             ← Gate: tests, typecheck, branch protection
```