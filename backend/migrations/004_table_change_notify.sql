-- =============================================================================
-- Table Change Notification System
-- =============================================================================
-- Creates a table_changes log table and triggers on all tracked tables.
-- On INSERT/UPDATE/DELETE, a record is inserted into table_changes.
-- Enables polling-based real-time update detection for the frontend.
-- =============================================================================

-- ─── Table Changes Log ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS table_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_table_changes_changed_at ON table_changes(changed_at DESC);
CREATE INDEX idx_table_changes_table_name ON table_changes(table_name);

ALTER TABLE table_changes ENABLE ROW LEVEL SECURITY;

-- ─── Trigger Function ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_table_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO table_changes (table_name, operation)
    VALUES (TG_TABLE_NAME, TG_OP);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Triggers for Each Tracked Table ─────────────────────────────────────
CREATE TRIGGER trg_table_change_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH STATEMENT
    EXECUTE FUNCTION notify_table_change();

CREATE TRIGGER trg_table_change_roles
    AFTER INSERT OR UPDATE OR DELETE ON roles
    FOR EACH STATEMENT
    EXECUTE FUNCTION notify_table_change();

CREATE TRIGGER trg_table_change_permissions
    AFTER INSERT OR UPDATE OR DELETE ON permissions
    FOR EACH STATEMENT
    EXECUTE FUNCTION notify_table_change();

CREATE TRIGGER trg_table_change_events
    AFTER INSERT OR UPDATE OR DELETE ON events
    FOR EACH STATEMENT
    EXECUTE FUNCTION notify_table_change();

-- ─── Cleanup: Archive table_changes older than 7 days ─────────────────────
-- Run via pg_cron or a scheduled job:
-- DELETE FROM table_changes WHERE changed_at < NOW() - INTERVAL '7 days';
