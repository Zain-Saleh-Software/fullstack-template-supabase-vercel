# Fullstack Template (Vercel + Supabase)

Production-ready, highly robust, and lightweight architecture template for building CRM and HR applications using **Next.js 15, Supabase, Drizzle ORM, and Tailwind CSS v4**.

## Architecture Overview

- **Frontend:** Next.js 15 App Router, React 19, Tailwind v4
- **Backend:** Next.js Route Handlers (Serverless APIs)
- **Database:** Supabase PostgreSQL, Drizzle ORM
- **Authentication:** Supabase Auth
- **State Management:** TanStack React Query (Server), Context (Local)
- **i18n:** `next-intl`
- **Observability:** Sentry + Custom structured logger
- **CI/CD:** GitHub Actions + Vercel

## Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Local Supabase** (Requires Docker running on your machine)
   ```bash
   npm run supabase:start
   ```

3. **Set Environment Variables**
   Copy `.env.example` to `.env.local` and use the local Supabase keys.

4. **Initialize Database**
   ```bash
   npm run db:generate
   npm run db:push
   ```
   *Note: Ensure you apply `drizzle/0001_custom_rls_and_triggers.sql` to your Supabase instance to enable RLS and Auth triggers.*

5. **Start Next.js**
   ```bash
   npm run dev
   ```

## Bootstrapping a New Project

This repository is designed to be used by an AI Agent (like Claude Code) to build a new project. To start:
1. Clone this repository.
2. Ask the AI Agent to: **"Bootstrap a new project from this template."**
3. The AI Agent will automatically read `RULES.md`, `CLAUDE.md`, and `skills/ai-init-project.md` to guide you through renaming, database initialization, and creating your custom business entities.
