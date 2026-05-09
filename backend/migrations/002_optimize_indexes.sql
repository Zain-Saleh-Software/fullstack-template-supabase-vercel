-- =============================================================================
-- Migration 002: Optimize Foreign Key Indexes
-- =============================================================================
-- Adds covering indexes on foreign key columns and improves query performance
-- for JOIN operations on permissions and events tables.
-- =============================================================================

-- ─── Permissions FK Indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_permissions_role_id ON permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_action_resource ON permissions(action, resource);

-- ─── Events FK Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_entity_id ON events(entity_id);
-- idx_events_actor_id already exists from 001_initial, but adding composite
CREATE INDEX IF NOT EXISTS idx_events_entity_type_created ON events(entity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_actor_id_created ON events(actor_id, created_at DESC);

-- ─── Users Composite Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_role_created ON users(role, created_at DESC);
