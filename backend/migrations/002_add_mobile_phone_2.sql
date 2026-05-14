-- =============================================================================
-- Add mobile_phone_2 and department columns to contacts table
-- =============================================================================

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mobile_phone_2 TEXT;

ALTER TABLE contacts ADD CONSTRAINT chk_mobile_phone_2_not_empty_if_provided
    CHECK (mobile_phone_2 IS NULL OR mobile_phone_2 != '');
