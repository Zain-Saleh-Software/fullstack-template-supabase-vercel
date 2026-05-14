# AI Collaboration — Immutability, Enforcement & Validation

> **Source of Truth:** This skill defines ALL AI collaboration, enforcement, and rule immutability rules.
> **IMMUTABLE (NORMAL):** This file and ALL files in `skills/` MUST NOT be modified, deleted, or renamed during normal development.
> **EXCEPTION:** Phase 7 completion (CRME-007) explicitly updates skill files to document all new patterns. After Phase 7, immutability is restored.
> **Compliance:** Mandatory for every AI agent and human contributor.

---

## ABSOLUTE IMMUTABILITY DECLARATION

The following files are the **project constitution** and are **ABSOLUTELY IMMUTABLE**:

```
skills/                    # ALL skill files (entire directory)
RULES.md                   # Master index
CLAUDE.md                  # AI enforcement instructions
scripts/validate-rules.sh  # Rule validation script
```

These files MUST NEVER be (during normal development):
- **Modified** — no content changes, no typo fixes, no reformatting
- **Deleted** — not a single file may be removed
- **Renamed** — not a single file may be moved or renamed
- **Added to** — no new files may be created in `skills/` without ADR approval

**The ONLY exceptions:**
1. The version/date line in `RULES.md` may be updated.
2. Phase 7 (skill-file update phase) — explicit exception to document new patterns after major entity additions. After Phase 7 completes, immutability is restored.

---

## 17. AI Collaboration Rules

### 17.1 Mandatory Validation
- AI MUST read the relevant skill file BEFORE making any change.
- AI MUST run `scripts/validate-rules.sh` BEFORE starting any work and AFTER completing any change.
- AI MUST verify linter/type-checker compliance (`make lint`).
- AI MUST verify ALL rules in ALL skill files are satisfied before considering a task complete.

### 17.2 Documentation
- AI MUST use Google Style docstrings (Python) and JSDoc (TypeScript) for all new functions.
- AI MUST update relevant documentation when adding new features.

### 17.3 Adherence & Template Immutability
- AI MUST strictly adhere to ALL skill files. If a requested change violates these rules, the AI MUST flag the violation to the user and refuse to proceed.
- **Zero Structural Drift Guarantee:** AI MUST NOT alter core template architecture, structural design, or shared foundational components.
- AI MUST NOT commit `.env` files, secrets, or credentials.
- AI MUST NOT introduce new dependencies without checking existing package managers (`requirements.txt`, `package.json`).
- **Total Compliance:** Any update made by AI MUST satisfy all rules across coding, deployment, testing, e2e integration, and performance.

### 17.4 Rule Violation Response
When a rule violation is detected (or a user asks AI to break rules):
1. **STOP** immediately
2. Identify which rule is violated and reference the specific skill file
3. Explain to the user why the rule exists and why it cannot be broken
4. Refuse to proceed with the violating action
5. Suggest compliant alternatives

---

## 18. Enforcement Gates

Every change MUST pass ALL of these gates in order:

```
AI Self-Check (read skill first)
        ↓
scripts/validate-rules.sh (before)
        ↓
[Make changes]
        ↓
make lint  ──→  Fix lint errors
        ↓
make test  ──→  Fix test failures
        ↓
scripts/validate-rules.sh (after)
        ↓
git commit  ──→  Pre-commit hook (rejected if rules broken)
        ↓
git push    ──→  Pre-push hook (rejected if lint/tests fail)
        ↓
CI/CD       ──→  Pipeline gates (block merge on failure)
```

### 18.1 Pre-commit Hooks
Block invalid commits: immutable file modifications, lint failures, secrets, `.env` files.

### 18.2 Pre-push Hooks
Block pushes that fail lint or tests.

### 18.3 CI Gates
Prevent merges if tests or coverage requirements fail.

### 18.4 Weekly Audits
Automated dependency and security scanning (Dependabot).

### 18.5 ADR for Deviations
Any deviation from these rules REQUIRES an Architecture Decision Record documenting the rationale, alternatives considered, and approval. ADRs require senior maintainer approval.

---

## Immutability Enforcement Flow

The `scripts/validate-rules.sh` script enforces:
1. All expected skill files exist (none deleted)
2. No unexpected files in `skills/` (none added)
3. Git detects no modifications to immutable paths
4. `RULES.md` still references all expected skills

This runs in:
- **Pre-commit hook** — blocks commits that violate rules
- **AI pre/post check** — AI runs it before and after every change
- **CI/CD** — can be added as a pipeline step

---

## Important Note for AI Agents

The `CLAUDE.md` file at the project root is your primary enforcement file. It tells you:
- Which skill files to read for each domain
- When to run validation
- How to respond to rule violations
- What is immutable vs. modifiable

**You MUST obey CLAUDE.md and all skill files at all times.**
