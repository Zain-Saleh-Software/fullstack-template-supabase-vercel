-- =============================================================================
-- Initial Database Schema
-- =============================================================================
-- Run this in your Supabase SQL editor or directly on PostgreSQL.
-- Creates all required tables: users, roles, permissions, events.
-- =============================================================================

-- ─── Users ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_email_lower ON users(LOWER(email));
-- TODO: For production, consider using the citext extension instead for case-insensitive email comparisons.
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ─── Roles ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, description, is_system) VALUES
    ('admin', 'Full system access', true),
    ('technician', 'Technical operations access', true),
    ('member', 'Content contributor access', true),
    ('customer', 'Basic read-only access', true)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- ─── Permissions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, action, resource)
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- ─── Events (BUSINESS EVENTS ONLY — added on top of logs/traces/metrics) ─
-- BOUNDARY RULE (see observability-patterns.md):
--   EVERY operation has logs + traces + metrics.
--   Events table is ONLY for data that ALSO passes the Golden Question.
--
--   Ask: "Would a user/business need to see this record in a year?"
--   YES → events table + logs + traces + metrics
--   NO  → logs + traces + metrics only
--
-- Good: user.registered, order.placed, subscription.changed, role.updated
-- Bad:  auth.login, api.request, function.timing, debug.info
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    actor_id TEXT,
    metadata JSONB DEFAULT '{}',
    severity TEXT DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_entity_type ON events(entity_type);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_actor_id ON events(actor_id);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_severity ON events(severity);
CREATE INDEX idx_events_metadata ON events USING GIN(metadata);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ─── Auto-update updated_at trigger ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
