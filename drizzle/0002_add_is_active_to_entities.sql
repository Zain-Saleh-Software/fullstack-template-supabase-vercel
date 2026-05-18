-- Migration: Add is_active to entity tables that were missing it
-- This ensures all RULES.md §3.2 requirements are met

-- Add is_active to roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- Add is_active to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- Add is_active to table_changes
ALTER TABLE table_changes ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- Add is_active to accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- Add is_active to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- Add is_deleted and deleted_at to roles (they were also missing these)
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false NOT NULL;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Add is_deleted and deleted_at to events (they were also missing these)
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false NOT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Add is_deleted and deleted_at to table_changes (they were also missing these)
ALTER TABLE table_changes ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false NOT NULL;
ALTER TABLE table_changes ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Add updated_at to events and table_changes if missing
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE table_changes ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- Add updated_at trigger for events
DROP TRIGGER IF EXISTS set_updated_at_events ON events;
CREATE TRIGGER set_updated_at_events BEFORE UPDATE ON events FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Add updated_at trigger for table_changes
DROP TRIGGER IF EXISTS set_updated_at_table_changes ON table_changes;
CREATE TRIGGER set_updated_at_table_changes BEFORE UPDATE ON table_changes FOR EACH ROW EXECUTE PROCEDURE set_updated_at();