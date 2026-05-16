# Vercel + Supabase Fullstack Template Makefile

.PHONY: dev build start lint test db-generate db-push db-studio supabase-start supabase-stop help

help:
	@echo "Available commands:"
	@echo "  make dev             - Start Next.js dev server"
	@echo "  make build           - Build Next.js production app"
	@echo "  make start           - Start Next.js production app"
	@echo "  make lint            - Run ESLint and TypeScript checks"
	@echo "  make test            - Run Vitest tests"
	@echo "  make db-generate     - Generate Drizzle SQL migrations"
	@echo "  make db-push         - Push schema directly to database"
	@echo "  make db-studio       - Open Drizzle Studio UI"
	@echo "  make supabase-start  - Start local Supabase instance"
	@echo "  make supabase-stop   - Stop local Supabase instance"
	@echo "  make validate-rules  - Verify architecture rules are intact"

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

test:
	npm run test

db-generate:
	npm run db:generate

db-push:
	npm run db:push

db-studio:
	npm run db:studio

supabase-start:
	npm run supabase:start

supabase-stop:
	npm run supabase:stop

validate-rules:
	npm run validate-rules
