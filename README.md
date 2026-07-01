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

This template is designed to be used by an AI Agent (Claude Code, Cursor, etc.) to bootstrap a production-ready project in minutes. The agent will migrate your existing project—or build a new one from scratch—following the template's architecture, security, and quality standards.

### Quick Start

1. **Clone this repository:**
   ```bash
   git clone https://github.com/Zain-Saleh-Software/fullstack-template-supabase-vercel.git my-new-project
   cd my-new-project
   ```

2. **Run the bootstrap workflow:**
   Open the project in your AI agent (Claude Code, Cursor, etc.) and say:

   > "Bootstrap a new project from this template."

   The agent will guide you through the process. You can also provide a source project to migrate:

   > "Bootstrap a new project. Migrate everything from [repo URL / local path / project description] into this template."

3. **Customize with your own instructions:**
   You can layer on any additional requirements:

   > "...and add a Kanban board, real-time notifications, and Stripe billing."

### What the Agent Will Do

The bootstrap workflow (`skills/bootstrap-project/SKILL.md`) runs through **8 phases**:

| Phase | What Happens |
|-------|-------------|
| **Discovery** | Analyzes your source project, maps all entities/routes/pages, presents a migration plan for your approval |
| **Database** | Creates Drizzle schemas, generates migrations, migrates all data with zero loss, sets up RLS policies |
| **Auth & RBAC** | Migrates users to Supabase Auth, maps all roles/permissions to the template RBAC system |
| **API Routes** | Implements every endpoint with Zod validation, error handling, and permission checks |
| **Frontend** | Migrates every page/component with full i18n, dark mode, accessibility, loading states, and SEO metadata |
| **Integrations** | Wires up third-party services with proper env var management |
| **Testing** | Migrates existing tests and adds schema/API route tests meeting 70%+ coverage thresholds |
| **Deployment** | Configures Vercel + Supabase, deploys to staging and production |

### Giving the Agent Production Credentials

To let the agent deploy everything live immediately, provide these credentials in your prompt or as environment variables. The agent will handle the rest:

**Vercel:**
- `VERCEL_TOKEN` — Personal access token from [Vercel Account Settings](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` & `VERCEL_PROJECT_ID` — Found under Vercel project settings, or the agent can create a new project

**Supabase (Production):**
- `SUPABASE_ACCESS_TOKEN` — Personal access token from [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
- `SUPABASE_PROJECT_ID` — Your production project ref, or let the agent create one

**Other Services (optional):**
- `SENTRY_AUTH_TOKEN` — For error monitoring
- Any third-party API keys your project needs (Stripe, Resend, etc.)

Example prompt with credentials:

> "Bootstrap this project. My existing project is at github.com/me/my-app. Connect to Vercel using token vrt_xxx, org ID yyy, and deploy to production. Use Supabase project ref zzz with access token sbp_aaa. Also integrate Stripe with key sk_test_bbb."

### After Bootstrapping

The agent will deliver:
- ✅ All source features, APIs, and pages working identically in the template
- ✅ Zero data loss from migration
- ✅ All POC/demo code removed
- ✅ `npm run lint`, `typecheck`, `test`, and `build` all passing
- ✅ Deployed and live on Vercel + Supabase
