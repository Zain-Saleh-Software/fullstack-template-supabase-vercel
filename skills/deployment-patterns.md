# Deployment & CI/CD

> **Source of Truth:** This skill defines ALL deployment and CI/CD rules for the template.
> **Compliance:** Mandatory for every PR, commit, and deployment.
> **Deviation:** Requires an Architecture Decision Record (ADR).

---

## 13.1 Pipeline Stages

1. **Lint** (parallel): `ruff check` (Python) + `eslint` (TypeScript) — any failure blocks pipeline.
2. **Secret Scan**: `git-leaks` or equivalent — scans entire repo for hardcoded secrets, API keys, and credentials. Blocks on any finding.
3. **SAST** (Static Analysis): Python — `bandit` or `ruff` security rules. Frontend — `eslint` with security plugin. Blocks on high-severity findings.
4. **SCA / Dependency Scan**: `npm audit` (Node) + `safety` or `pip-audit` (Python) — checks lockfiles for known vulnerabilities. Blocks on critical/high.
5. **IaC Scan** (if IaC files changed): `checkov` or `kics` on Dockerfile, docker-compose, and deploy configs.
6. **Test**: `pytest` with `--cov-fail-under=80` (Backend) + `vitest run` (Frontend).
7. **Build**: Docker Buildx, build + push images to GHCR with tags `latest` and `${{ github.sha }}`.
8. **Manual Approval Gate** (production deploy only): A human MUST approve the deployment before it proceeds to production.
9. **Deploy** (on main/release push): SSH to production → run DB migrations → pull new images → `docker-compose up` → smoke test → auto-rollback on failure.
10. **Vercel Deploy** (after deploy): Frontend to Vercel (main/release branches only).

---

## 13.2 Immutability

- Build once, deploy many. The same Docker image MUST be used for Staging and Production.
- Docker image tags: `latest` for latest stable, `${{ github.sha }}` for specific version.
- **Environment Promotion:** dev → staging → production.

---

## 13.3 Docker Standards

- **Multi-Stage Build:** Every Dockerfile MUST have `builder` and `runner` stages.
- **Base Images:** Python: `python:3.12-slim`. Node: `node:20-alpine`. Nginx: `nginx:1.27-alpine`.
- **Non-Root User:** `runner` stage MUST create and use a non-root user.
- **HEALTHCHECK:** Every Dockerfile MUST include HEALTHCHECK instruction.
- **.dockerignore:** MUST exclude `.env`, `.venv/node_modules`, `__pycache__`, `*.pyc`, `.git`, tests, `*.md`.

---

## 13.4 Deployment Targets

### Docker Compose (dev)
`docker-compose.yml` — Backend + Frontend services, shared bridge network. Frontend depends on backend healthy. Env files: `backend.env`, `frontend.env`.

### Docker Compose (prod)
`deploy/docker-compose.prod.yml` — Nginx reverse proxy (port 80/443, SSL volumes) + Backend (expose 8000) + Frontend (expose 80). Uses `../.env`.

### Vercel (frontend)
`frontend/vercel.json` — Framework: Vite. Build command: `npm run build`. Output: `dist`. SPA rewrites: all routes → `/index.html`. Asset cache: immutable, max-age 31536000.

### Render
`deploy/render.yaml` — Two services: `fullstack-backend` (Python, `uvicorn app.main:app`) and `fullstack-frontend` (static site, publish `./dist`). Health check path: `/api/v1/health`.

### AWS ECS
`deploy/aws/ecs-task-definition.json` — Launch type: FARGATE. CPU: 512, Memory: 1024 MB. Two containers: backend (port 8000) and frontend (port 80). Secrets via AWS SSM Parameter Store. Log driver: `awslogs`.

### Nginx Reverse Proxy
`deploy/nginx.conf` — SSL termination, security headers, CSP with `connect-src *.supabase.co`, static file caching, backend proxy `/api/` → `backend:8000`, SPA fallback.

### Nginx SPA
`frontend/nginx/default.conf` — GZip, security headers, 1y cache for static assets, SPA fallback to `index.html`, `/nginx-health` endpoint.

---

## 13.5 Deployment Safety

- **Migrations First:** DB migrations MUST run and succeed before the app deployment starts.
- **Smoke Tests:** Automated health check (`/api/v1/health`) MUST run immediately after deployment.
- **Rollback:** Automated rollback to previous version on smoke test failure.
- **Health Check:** Backend health check validates DB connectivity. Returns `{"status": "ok", "app": "...", "version": "...", "environment": "...", "database": "connected"}` when DB is reachable, or `{"status": "degraded", "database": "disconnected"}` when DB is unreachable.

---

## 13.6 SCM Security

Source Code Management (GitHub, GitLab, etc.) configuration is critical for CI/CD security:

### Branch Protection
- **Protected branches** MUST be configured for `main` and `release/*` branches.
- **Pull request reviews** are REQUIRED before merging to protected branches. At least one reviewer must approve.
- **Auto-merge rules** MUST be disabled (no automatic merging without human review).
- **Commits MUST be signed** (GPG or SSH) for merges to protected branches.

### Access Control
- **MFA MUST be enabled** for all SCM accounts with write access.
- **Default permissions** MUST NOT be assigned to all users. Explicitly grant only the permissions each role needs.
- **External/ephemeral contributors** MUST have limited, time-bound access.

### CI/CD Config
- The CI/CD pipeline configuration file (e.g., `.github/workflows/`) MUST be version-controlled.
- Pipeline configuration changes MUST go through the same PR review process as code changes.

---

## 13.7 CI/CD IAM (Identity & Access Management)

### Secrets Management
- Secrets (API keys, passwords, tokens) used in CI/CD MUST use the **platform's built-in secrets manager** (GitHub Secrets, GitLab CI Variables, etc.).
- **NEVER hardcode secrets** in CI/CD configuration files or pipeline scripts.
- **Secret scanning** (git-leaks, git-secrets) MUST be integrated into the pipeline to detect accidentally committed secrets before they reach the remote.
- Secrets MUST NOT be:
  - Printed to the console or job logs.
  - Leaked to command history files.
  - Embedded in Docker images or compiled binaries.

### Least Privilege
- **Deny by default:** Pipeline credentials MUST only grant the minimum permissions required (e.g., a deployment token should only have write access to the specific repository or service it deploys).
- **Credential isolation:** Different pipelines (e.g., staging vs. production) MUST use different credentials. Never share credentials between pipelines of different sensitivity levels.
- **CI/CD runner accounts** MUST NOT run with root or administrator privileges. GitHub/GitLab hosted runners already satisfy this; self-hosted runners MUST use a dedicated non-privileged user.

### Identity Lifecycle
- **Shared accounts** are FORBIDDEN. Every human user MUST have their own SCM account.
- **Deprovisioning:** When a user leaves the team, their SCM access MUST be revoked immediately.

---

## 13.8 Dependency Management

### Version Pinning & Lockfiles
- ALL dependencies MUST be **version-pinned** to specific versions (no floating ranges like `^1.0.0` or `>=1.0`).
- **Lockfiles MUST be committed** to source control: `package-lock.json`, `Pipfile.lock`, or equivalent.
- The lockfile MUST be **enforced during install** (e.g., `npm ci` instead of `npm install`, `pip install` with constraints).

### Integrity Verification
- Package integrity MUST be verified via **hash/checksum** comparison. Lockfiles natively provide this (e.g., `package-lock.json` includes `integrity` hashes, `Pipfile.lock` includes `sha256` hashes).
- **DO NOT disable integrity checks** (e.g., never use `npm install --ignore-scripts` without understanding the security implications).

### Supply Chain Risk
- **SCA scanning** MUST be integrated into the pipeline to detect known vulnerabilities in dependencies (see §13.1 Pipeline Stages step 4).
- **Private feeds** SHOULD be preferred for internal/organizational packages to prevent dependency confusion attacks.
- When consuming public packages, prefer **well-maintained, widely-used packages** over obscure ones. Review package provenance where possible.

---

## 13.9 Integrity Assurance

- **Docker containers** MUST NOT use the `--privileged` flag (prevents container escape attacks).
- **Pipeline execution environments** MUST run as non-root users. Hosted runners (GitHub Actions, GitLab CI) satisfy this by default.
- **Docker images** MUST use multi-stage builds with a non-root runner user (see §13.3 Docker Standards).
- Consider **supply-chain integrity** by reviewing the SLSA framework (https://slsa.dev) for production deployments.

---

## 13.10 Pre-Push Hooks

The pre-push hook (`.githooks/pre-push`) runs in order:
1. `ruff check .` (backend lint)
2. `pytest` (backend tests)
3. `npm run lint` (frontend lint)
4. `npm test` (frontend tests)

ALL MUST pass before push succeeds.

---

## 13.11 Dependabot

- Weekly updates for pip, npm, and GitHub Actions.
- Labels: `dependencies/python`, `dependencies/javascript`, `dependencies/github-actions`.
- Ignore React >=19 (template compatibility).

---

## 13.12 Makefile Command Conventions

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make dev` | Start all services in dev mode |
| `make build` | Build all services |
| `make test` | Run all tests |
| `make lint` | Run all linters |
| `make format` | Format all code |
| `make clean` | Clean build artifacts |
| `make docker-build` | Build Docker images |
| `make docker-push` | Push Docker images |
| `make db-migrate` | Run database migrations |
| `make deploy` | Deploy to production |
