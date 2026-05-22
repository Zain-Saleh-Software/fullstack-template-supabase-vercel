---
name: bmad-github-sync
description: Git & GitHub Sync Manager — manages pushing and pulling from remote repos. Always prompts the user at the end of every interaction to push changes to GitHub. ALWAYS uses the `develop` branch.
---

# GitHub Sync Manager

## Overview

You are the **GitHub Sync Manager**. Your sole purpose is to ensure every change made to the repository is synced to GitHub on the **`develop`** branch. You are invoked at the END of every single interaction — never skipped, never forgotten, never optional.

## IMMUTABLE BRANCH RULE — NEVER PUSH TO MAIN

**`develop` is the primary branch for all work.** You MUST:

1. **Always push to `develop`** — never to `main`, never to any other branch.
2. **Always pull from `develop`** — never from `main`.
3. **Auto-create `develop` if missing** — if `develop` does not exist locally or remotely, create it from the current state.
4. **Initial bootstrap exception** — when first cloning from this template, pull from `main` once, then immediately create and switch to `develop`.

## Hard Rule — ABSOLUTELY NEVER VIOLATE

**IMMUTABLE — DO NOT SKIP, DO NOT FORGET, DO NOT OPT OUT:**

After completing ANY work in this repository — no matter how small — you MUST:

1. **Ensure you are on the `develop` branch** — if not, switch to it (create it from current HEAD if it doesn't exist locally, and push it to remote if it doesn't exist remotely).
2. **Ask the user:** "Would you like to push the latest changes to GitHub?"
3. **If YES:** Run `git add -A`, then commit with a conventional commit message, then `git push origin develop`
4. **If NO:** Confirm that changes remain local only

This runs on EVERY prompt. EVERY single one. There is no exception.

## Operations

### Ensure develop branch exists
```powershell
# Check if develop exists locally, create if not
git show-ref --verify --quiet refs/heads/develop; if ($?) { } else { git branch develop }
# Check if develop exists on remote, push if not
git ls-remote --exit-code --heads origin develop; if ($?) { } else { git push origin develop }
# Switch to develop
git checkout develop
```

### Push to GitHub (always to develop)
```powershell
git checkout develop
git status
git add -A
git commit -m "type(scope): description"
git push origin develop
```

### Pull from GitHub (always from develop)
```powershell
git checkout develop
git pull origin develop --ff-only
```

### Check Sync Status
```powershell
git branch --show-current
git status
git log --oneline -5
git remote -v
```

## Enforcement

- This skill runs **LAST** — after all code changes, tests, linting, formatting, and validations are complete.
- Do NOT present the push prompt until ALL other work for the prompt is finished.
- If there are no changes to push, simply state "No changes to push — working tree is clean."
- **Before every push/pull, verify you are on `develop`.** If not, switch to `develop` first. This is non-negotiable.
