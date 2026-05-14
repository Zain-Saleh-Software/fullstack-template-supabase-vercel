# =============================================================================
# Fullstack Template - Makefile
# =============================================================================
# Usage:
#   make help          - Show this help
#   make setup-hooks   - Install git hooks
#   make install       - Install all dependencies
#   make dev           - Run in development mode
#   make build         - Build for production
#   make start         - Start production services
#   make stop          - Stop production services
#   make restart       - Restart production services
#   make test          - Run all tests
#   make lint          - Run all linters
#   make format        - Format all code
#   make clean         - Clean build artifacts
#   make docker-build  - Build Docker images
#   make docker-push   - Push Docker images
#   make deploy        - Deploy to production
#   make logs          - View logs
#   make db-migrate    - Run database migrations
# =============================================================================

.PHONY: help install dev build start start-dev stop stop-dev restart test lint format clean

# ─── Colors ───────────────────────────────────────────────────────────────────
BLUE := \033[1;34m
GREEN := \033[1;32m
YELLOW := \033[1;33m
RED := \033[1;31m
RESET := \033[0m

help:
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@echo "$(GREEN)  Fullstack Template - Makefile$(RESET)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)  %-20s$(RESET) %s\n", $$1, $$2}'

# ─── Installation ──────────────────────────────────────────────────────────────

setup-hooks:  ## Install git hooks
	@echo "$(BLUE)→ Setting up git hooks...$(RESET)"
	git config core.hooksPath .githooks
	chmod +x .githooks/pre-commit .githooks/pre-push 2>/dev/null || true  # Works on Unix/WSL/Git Bash; optional on Windows

install: install-backend install-frontend  ## Install all dependencies

install-backend:  ## Install backend dependencies
	@echo "$(BLUE)→ Installing backend dependencies...$(RESET)"
	python -m pip install -r backend/requirements.txt

install-frontend:  ## Install frontend dependencies
	@echo "$(BLUE)→ Installing frontend dependencies...$(RESET)"
	cd frontend && npm install

# ─── Development ───────────────────────────────────────────────────────────────

dev: dev-backend dev-frontend  ## Run in development mode

dev-backend:  ## Run backend in development mode
	@echo "$(BLUE)→ Starting backend...$(RESET)"
	cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:  ## Run frontend in development mode
	@echo "$(BLUE)→ Starting frontend...$(RESET)"
	cd frontend && npm run dev

# ─── Build ────────────────────────────────────────────────────────────────────

build: build-backend build-frontend  ## Build for production

build-backend:  ## Build backend
	@echo "$(BLUE)→ Building backend...$(RESET)"
	cd backend && python -m pip install -r requirements.txt -t dist

build-frontend:  ## Build frontend
	@echo "$(BLUE)→ Building frontend...$(RESET)"
	cd frontend && npm run build

# ─── Production ────────────────────────────────────────────────────────────────

start:  ## Start production services with Docker
	@echo "$(BLUE)→ Starting production services...$(RESET)"
	docker-compose -f docker-compose.yml up -d

start-dev:  ## Start development services with Docker (auto-reload on changes)
	@echo "$(BLUE)→ Starting development services...$(RESET)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

start-prod:  ## Start production services with full stack (nginx + SSL)
	@echo "$(BLUE)→ Starting full production stack...$(RESET)"
	docker compose -f deploy/docker-compose.prod.yml up -d

stop:  ## Stop production services
	@echo "$(BLUE)→ Stopping production services...$(RESET)"
	docker-compose -f docker-compose.yml down

stop-dev:  ## Stop development services
	@echo "$(BLUE)→ Stopping development services...$(RESET)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

restart: stop start  ## Restart production services

logs:  ## View production logs
	docker-compose -f docker-compose.yml logs -f

# ─── Rules Validation ─────────────────────────────────────────────────────────

validate-rules:  ## Validate template rules integrity
	@echo "$(BLUE)→ Validating rules integrity...$(RESET)"
	@bash scripts/validate-rules.sh

# ─── Testing ───────────────────────────────────────────────────────────────────

test: test-backend test-frontend  ## Run all tests

test-backend:  ## Run backend tests
	@echo "$(BLUE)→ Running backend tests...$(RESET)"
	cd backend && python -m pytest tests/ -v

test-frontend:  ## Run frontend tests
	@echo "$(BLUE)→ Running frontend tests...$(RESET)"
	cd frontend && npm run test

# ─── Linting & Formatting ─────────────────────────────────────────────────────

lint: lint-backend lint-frontend  ## Run all linters

lint-backend:  ## Lint backend
	@echo "$(BLUE)→ Linting backend...$(RESET)"
	cd backend && ruff check . && ruff format --check .

lint-frontend:  ## Lint frontend
	@echo "$(BLUE)→ Linting frontend...$(RESET)"
	cd frontend && npm run lint

format: format-backend format-frontend  ## Format all code

format-backend:  ## Format backend
	@echo "$(BLUE)→ Formatting backend...$(RESET)"
	cd backend && ruff format .

format-frontend:  ## Format frontend
	@echo "$(BLUE)→ Formatting frontend...$(RESET)"
	cd frontend && npm run format

# ─── Docker ───────────────────────────────────────────────────────────────────

docker-build:  ## Build Docker images
	@echo "$(BLUE)→ Building Docker images...$(RESET)"
	docker-compose -f docker-compose.yml build

docker-push:  ## Push Docker images to registry
	@echo "$(BLUE)→ Pushing Docker images...$(RESET)"
	docker-compose -f docker-compose.yml push

# ─── Cleanup ──────────────────────────────────────────────────────────────────

clean:  ## Clean build artifacts
	@echo "$(BLUE)→ Cleaning...$(RESET)"
	# Remove dist directories
	test ! -d backend/dist || rm -rf backend/dist
	test ! -d frontend/dist || rm -rf frontend/dist
	# Remove Python caches
	find . -type d \( -name __pycache__ -o -name .pytest_cache -o -name '*.egg-info' \) -exec rm -rf {} + 2>/dev/null; true

# ─── Database ─────────────────────────────────────────────────────────────────

db-migrate:  ## Run database migrations
	@echo "$(BLUE)→ Running migrations...$(RESET)"
	cd backend && python -m app.utils.migrate

# ─── Deployment ────────────────────────────────────────────────────────────────

deploy:  ## Deploy to production
	@echo "$(BLUE)→ Deploying...$(RESET)"
	make docker-build
	make docker-push
	@echo "$(YELLOW)Note: SSH into your server and run: docker-compose pull && docker-compose up -d$(RESET)"

deploy-vercel:  ## Deploy frontend to Vercel
	@echo "$(BLUE)→ Deploying frontend to Vercel...$(RESET)"
	cd frontend && npx vercel --prod
