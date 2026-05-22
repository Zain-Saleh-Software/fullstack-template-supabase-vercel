# GitHub Workflow Skill (Vercel + Supabase Stack)

**Description:** Patterns for the Git branching strategy, conventional commits, PR workflow, git hook compliance, and the mandatory GitHub sync protocol.
**Role:** The Executor

---

## 1. Branch Strategy (Immutable)

```
main       ← Production only. NEVER commit or push directly.
develop    ← Primary working branch. ALL work happens here.
feature/*  ← Optional. Merge into develop via PR.
```

### Day-to-Day Workflow

```bash
# 1. Ensure you're on develop
git checkout develop
git pull origin develop

# 2. (Optional) Create a feature branch for large changes
git checkout -b feature/my-feature

# 3. Make changes, commit

# 4. Merge back to develop
git checkout develop
git merge feature/my-feature

# 5. Push to develop
git push origin develop
```

### Rules

- Pre-push hook BLOCKS direct pushes to `main`
- All production deploys go through `main` via PR from `develop`
- Never force push to `main` or `develop`
- Keep `develop` up to date with `main` after production deploys

---

## 2. Conventional Commits

Every commit message MUST follow this format:

```
<type>(<scope>): <description>
```

### Commit Types

| Type | Use When | Example |
|------|----------|---------|
| `feat` | New feature or functionality | `feat(auth): add password reset flow` |
| `fix` | Bug fix | `fix(api): handle null database response` |
| `refactor` | Code restructuring without feature change | `refactor(db): extract audit field helper` |
| `test` | Adding or updating tests | `test(api): add edge case tests for invoices` |
| `docs` | Documentation only | `docs(skills): update deployment skill` |
| `chore` | Maintenance, deps, config | `chore(deps): upgrade drizzle-orm to 0.45` |
| `style` | Formatting, whitespace, semicolons | `style: fix inconsistent indentation` |
| `perf` | Performance improvement | `perf(queries): add index on created_at` |

### Scope (Optional but Recommended)

Use the domain being changed: `auth`, `api`, `db`, `frontend`, `tests`, `config`, `skills`, `councils`

### Examples

```
feat(invoices): add invoice CRUD API routes with RBAC
fix(auth): prevent session expiry during active use
refactor(schema): normalize account_owner relationship
test(invoices): add coverage for permission edge cases
docs(readme): update deployment instructions for new env vars
chore(ci): add Sentry release step to production deploy
```

---

## 3. GitHub Sync Protocol (After Every Prompt)

After EVERY prompt that produced code changes, follow this protocol:

### Step 1: Verify Branch
```bash
git branch --show-current
# Must output: develop
```

If not on `develop`: `git checkout develop`

### Step 2: Check Status
```bash
git status
```
Review what changed. Ensure no immutable files are modified.

### Step 3: Stage Changes
```bash
git add -A
```

### Step 4: Commit with Conventional Message
```bash
git commit -m "type(scope): description"
```

### Step 5: Push
```bash
git push origin develop
```

### Step 6: Ask User
> "Changes complete. Push to GitHub on develop? (y/n)"

If user says YES → execute the commit and push
If user says NO → remind them to push later, do NOT commit

---

## 4. Git Hooks

### Pre-Commit Hook (`.githooks/pre-commit`)

Runs automatically before each commit:

1. Checks for immutable file modifications (`CLAUDE.md`, `RULES.md`, `.agents/`, `.claude/`)
2. Runs rule validation (`npm run validate-rules`)
3. Blocks `.env` file commits
4. Scans for secrets (AWS keys, private keys, service role keys)
5. Runs TypeScript type check (`tsc --noEmit`)
6. Runs linter (`npm run lint`)

If ANY check fails → commit is BLOCKED.

### Pre-Push Hook (`.githooks/pre-push`)

Runs automatically before each push:

1. Blocks pushes to `main` or `master`
2. Runs TypeScript type check
3. Runs linter
4. Runs all tests (`npm run test`)

If ANY check fails → push is BLOCKED.

### Installing Hooks

```bash
git config core.hooksPath .githooks
```

This is typically done once during project setup.

---

## 5. PR Workflow (For Production)

### When to Create a PR
- Deploying to production (develop → main)
- Large feature merges (feature/* → develop)
- User explicitly requests a PR

### PR Creation
```bash
# Create PR from develop to main
gh pr create --base main --head develop --title "Release: version description" --body "Description of changes included in this release."
```

### PR Checklist
- [ ] All changes are on `develop`
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] CI/CD pipeline passes on the PR
- [ ] PR description explains what changed and why
- [ ] No merge conflicts

---

## 6. Common Git Operations

### Starting Fresh
```bash
git checkout develop
git pull origin develop
```

### Undoing Uncommitted Changes
```bash
git checkout -- <file>    # Discard changes to a specific file
git reset --hard HEAD     # Discard ALL uncommitted changes (DANGEROUS)
```

### Undoing the Last Commit (Not Pushed)
```bash
git reset --soft HEAD~1   # Undo commit, keep changes staged
git reset HEAD~1          # Undo commit, unstage changes
```

### Stashing Work
```bash
git stash                 # Save uncommitted work
git stash pop             # Restore stashed work
```

### Viewing History
```bash
git log --oneline -10     # Last 10 commits, compact
git log --oneline --graph # Visual branch graph
git diff                  # Unstaged changes
git diff --staged         # Staged changes
```

---

## 7. Forbidden Git Operations

NEVER do these:
- `git push origin main` — blocked by pre-push hook
- `git push --force` — destructive to shared branches
- `git commit --no-verify` — bypasses security checks
- `git push --no-verify` — bypasses test/lint checks
- `git reset --hard` on a pushed branch — destroys shared history

---

## 8. Repository Hygiene

- `.gitignore` must exclude: `node_modules/`, `.next/`, `.env*.local`, `coverage/`
- Never commit large files (>10MB) — use external storage
- Never commit generated files (except Drizzle migration snapshots)
- Never commit secrets, tokens, or keys
- Keep branches clean — delete merged feature branches

---

## Validation Checklist

- [ ] On `develop` branch before committing
- [ ] Commit message follows conventional commits format
- [ ] No immutable files modified or staged
- [ ] Pre-commit hook passes (no bypass)
- [ ] Pre-push hook passes (no bypass)
- [ ] User prompted before pushing to GitHub
- [ ] No direct pushes or commits to `main`
- [ ] `.gitignore` excludes sensitive and generated files
- [ ] No secrets in commits
- [ ] Feature branches deleted after merging
