#!/usr/bin/env bash
# =============================================================================
# Local Development Environment Initialization
# =============================================================================

set -e

echo "Starting local Supabase instance..."
npx supabase start

echo "Pushing schema to local database..."
npm run db:push

echo "Applying custom RLS and Triggers..."
npx supabase db execute --file drizzle/0001_custom_rls_and_triggers.sql

echo "Seeding the database..."
npm run db:seed

echo "✓ Local environment ready."
