-- =============================================================================
-- Migration 003: Partition Events Table by Month
-- =============================================================================
-- Migrates the events table to range partitioning on created_at,
-- creating monthly partitions for improved query performance and
-- easier data retention management.
--
-- NOTE: Run this as a transaction. Requires Postgres 12+.
-- If table is empty, the migration is instant.
-- If table has data, this performs a non-blocking migration via renaming.
-- =============================================================================

-- Step 1: Rename existing table
ALTER TABLE IF EXISTS events RENAME TO events_old;

-- Step 2: Create partitioned table
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    actor_id TEXT,
    metadata JSONB DEFAULT '{}',
    severity TEXT DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Step 3: Create initial partitions (current month + 12 months ahead)
SELECT TO_CHAR(generate_series, 'YYYY_MM') AS partition_suffix,
       generate_series AS partition_start,
       generate_series + INTERVAL '1 month' AS partition_end
INTO TEMP TABLE _partition_defs
FROM generate_series(
    DATE_TRUNC('month', NOW()) - INTERVAL '1 month',
    DATE_TRUNC('month', NOW()) + INTERVAL '12 months',
    INTERVAL '1 month'
);

DO $$
DECLARE
    rec RECORD;
    partition_name TEXT;
BEGIN
    FOR rec IN SELECT * FROM _partition_defs LOOP
        partition_name := 'events_' || rec.partition_suffix;
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF events FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            rec.partition_start,
            rec.partition_end
        );
    END LOOP;
END $$;

DROP TABLE _partition_defs;

-- Step 4: Recreate indexes on partitioned table
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_entity_type ON events(entity_type);
CREATE INDEX IF NOT EXISTS idx_events_actor_id ON events(actor_id);
CREATE INDEX IF NOT EXISTS idx_events_entity_id ON events(entity_id);
CREATE INDEX IF NOT EXISTS idx_events_entity_type_created ON events(entity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_actor_id_created ON events(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);
CREATE INDEX IF NOT EXISTS idx_events_metadata ON events USING GIN(metadata);

-- Step 5: Migrate existing data (if any)
INSERT INTO events SELECT * FROM events_old;

-- Step 6: Drop old table
DROP TABLE IF EXISTS events_old;

-- Step 7: RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Step 8: Auto-partition function (optional: call via pg_cron or monthly)
CREATE OR REPLACE FUNCTION create_next_event_partition()
RETURNS void AS $$
DECLARE
    next_month_start TIMESTAMPTZ := DATE_TRUNC('month', NOW() + INTERVAL '13 months');
    next_month_end TIMESTAMPTZ := next_month_start + INTERVAL '1 month';
    partition_name TEXT := 'events_' || TO_CHAR(next_month_start, 'YYYY_MM');
BEGIN
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF events FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        next_month_start,
        next_month_end
    );
END;
$$ LANGUAGE plpgsql;
