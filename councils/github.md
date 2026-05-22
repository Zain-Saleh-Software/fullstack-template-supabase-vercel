# GitHub Council

**Role:** Guardian of Git Workflow Compliance, Branch Strategy, Commit Quality, and Repository Integrity
**Authority:** Can reject changes that violate branch strategy, use improper commit messages, modify immutable files, or bypass git hooks
**Priority:** #3 (High — Repository hygiene ensures traceable, reviewable history)

## Mission

Ensure every code change follows the established branch strategy, uses conventional commit messages, protects immutable files, maintains clean git history, and follows the proper PR-based workflow for production deployments.

## Focus Areas

### 1. Branch Strategy (Immutable)

```
main       ← Production only. Never commit directly. Only via PR from develop.
develop    ← Primary development branch. All work happens here.
feature/*  ← Optional feature branches. Merge into develop via PR.
```

**Rules:**
- NEVER push directly to `main` (enforced by pre-push hook)
- Develop is the default working branch
- Feature branches are optional but recommended for large changes
- All merges to `main` must go through a PR from `develop`

### 2. Conventional Commits

Every commit message MUST follow the conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring |
| `test` | Adding or updating tests |
| `docs` | Documentation changes |
| `chore` | Maintenance, dependencies |
| `style` | Formatting, whitespace |
| `perf` | Performance improvements |

**Examples:**
```
feat(auth): add password reset flow
fix(api): handle null response from database query
refactor(db): extract audit field helper for schemas
test(api): add edge case tests for invoice creation
docs(skills): update deployment skill with Vercel config
chore(deps): upgrade drizzle-orm to 0.45
```

### 3. Immutable File Protection

Pre-commit hook enforces: `CLAUDE.md`, `RULES.md`, `.agents/`, `.claude/` are NEVER committed as modifications.

If changes to these files are needed:
1. Stop — do not modify
2. Inform the user that these files are immutable
3. Provide the template maintainer with suggested changes via alternative channels

### 4. Git Hook Compliance

**Pre-commit hook** enforces:
- No modified immutable files
- No `.env` files in commits
- No secrets in staged files
- TypeScript type check passes
- Lint passes

**Pre-push hook** enforces:
- No direct pushes to `main`/`master`
- TypeScript type check passes
- Lint passes
- All tests pass

### 5. PR Workflow (Production Deploy)

When deploying to production:
1. Ensure all changes are on `develop`
2. Open a PR from `develop` → `main`
3. CI/CD validates the PR (lint, test, build)
4. Review and merge the PR
5. Vercel automatically deploys `main` to production

### 6. GitHub Sync Protocol

After every prompt that produced code changes:
1. Confirm on `develop` branch: `git branch --show-current`
2. Ask the user: "Changes complete. Push to GitHub on develop? (y/n)"
3. If yes: `git add -A && git commit -m "type(scope): message" && git push origin develop`
4. If no: remind the user to push later

### 7. Repository Hygiene

- No large binary files in commits (use Git LFS or external storage)
- No `node_modules/`, `.next/`, `.env*` in repository
- No generated files committed (except migration snapshots)
- `.gitignore` properly maintained and respected
- No force pushes to `main` or `develop`

## Review Checklist

### Branch Check
- [ ] Working on `develop` branch (or approved feature branch)
- [ ] Not on `main` branch for direct commits
- [ ] Feature branch is up to date with `develop`

### Commit Check
- [ ] Commit message follows conventional commits format
- [ ] Commit message is descriptive (not just "fix" or "update")
- [ ] Commit doesn't contain sensitive data (keys, tokens, passwords)

### Immutable Files Check
- [ ] No changes to `CLAUDE.md`
- [ ] No changes to `RULES.md`
- [ ] No changes to `.agents/` directory
- [ ] No changes to `.claude/` directory

### Git Hooks Check
- [ ] Pre-commit hook didn't fail
- [ ] Pre-push hook didn't fail
- [ ] No hook bypass flags used (`--no-verify`, etc.)

### PR Check (if applicable)
- [ ] PR targets `main` from `develop`
- [ ] PR description explains what and why
- [ ] PR passes CI/CD (lint, test, build)
- [ ] PR doesn't contain merge conflicts

## Rejection Criteria

Reject changes that:
- ❌ Direct commits or pushes to `main`
- ❌ Non-conventional commit messages
- ❌ Modified immutable files (CLAUDE.md, RULES.md, .agents/, .claude/)
- ❌ Staged `.env` files
- ❌ Committed secrets or tokens
- ❌ Bypassed git hooks with `--no-verify`
- ❌ Force pushed to shared branches
- ❌ Missing PR for production deployment
- ❌ Branch not up to date with `develop`

## Escalation

- **Security Council:** Secrets in commits override all other concerns
- **Architect Council:** Immutable file modifications are architectural violations
- **Deployment Council:** Branch strategy ties directly to deployment pipeline

## Examples

### Good
```bash
# On develop, conventional commit, descriptive message
git checkout develop
git add -A
git commit -m "feat(invoices): add invoice CRUD API routes with RBAC"
git push origin develop
```

### Bad
```bash
# Wrong: On main, vague message, no conventional format
git checkout main
git add -A
git commit -m "stuff"
git push origin main
```
