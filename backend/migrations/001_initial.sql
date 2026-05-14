-- =============================================================================
-- Initial Database Schema — Consolidated (CRM POC Skeleton)
-- =============================================================================
-- Creates all core + CRM entities defined in skills/crm-database-patterns.md
-- All 8 core CRM entities: accounts, contacts, leads, opportunities,
-- activities, notes, cases, products
-- Also: users, roles, permissions, events, password_reset_tokens, table_changes
-- =============================================================================

-- ─── ENUM Types ──────────────────────────────────────────────────────────
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'disqualified');
CREATE TYPE opportunity_stage AS ENUM ('prospecting', 'qualification', 'proposal', 'negotiation', 'won', 'lost');
CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'task', 'note');
CREATE TYPE case_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- ─── Users ───────────────────────────────────────────────────────────────
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

CREATE INDEX idx_users_email_lower ON users(LOWER(email));
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ─── Password Reset Tokens ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- ─── Roles ───────────────────────────────────────────────────────────────
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

-- ─── Permissions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, action, resource)
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- ─── Events ──────────────────────────────────────────────────────────────
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

-- ─── Table Changes (Change Data Capture) ────────────────────────────────
CREATE TABLE IF NOT EXISTS table_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    entity_id TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_table_changes_table_name ON table_changes(table_name);
CREATE INDEX idx_table_changes_changed_at ON table_changes(changed_at DESC);
ALTER TABLE table_changes ENABLE ROW LEVEL SECURITY;

-- ─── CRM: Accounts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    account_type TEXT DEFAULT 'customer',
    status TEXT DEFAULT 'active',
    website TEXT,
    phone TEXT,
    address_line1 TEXT,
    address_city TEXT,
    address_state TEXT,
    address_postal_code TEXT,
    address_country TEXT,
    metadata JSONB DEFAULT '{}',
    search_text TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accounts_name ON accounts(name);
CREATE INDEX idx_accounts_domain ON accounts(domain);
CREATE INDEX idx_accounts_industry ON accounts(industry);
CREATE INDEX idx_accounts_owner_id ON accounts(owner_id);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_is_deleted ON accounts(is_deleted);
CREATE INDEX idx_accounts_metadata ON accounts USING GIN(metadata);
CREATE INDEX idx_accounts_search_text ON accounts USING GIN(to_tsvector('english', COALESCE(search_text, '')));
CREATE INDEX idx_accounts_owner_status ON accounts(owner_id, status);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- ─── CRM: Contacts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    mobile_phone TEXT,
    job_title TEXT,
    department TEXT,
    is_primary BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    search_text TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, email)
);

-- Add constraints for validation
ALTER TABLE contacts ADD CONSTRAINT chk_account_id_not_empty
    CHECK (account_id != '');

ALTER TABLE contacts ADD CONSTRAINT chk_first_name_not_empty
    CHECK (first_name != '');

ALTER TABLE contacts ADD CONSTRAINT chk_last_name_not_empty
    CHECK (last_name != '');

ALTER TABLE contacts ADD CONSTRAINT chk_phone_not_empty_if_provided
    CHECK (phone IS NULL OR phone != '');

ALTER TABLE contacts ADD CONSTRAINT chk_mobile_phone_not_empty_if_provided
    CHECK (mobile_phone IS NULL OR mobile_phone != '');

ALTER TABLE contacts ADD CONSTRAINT chk_email_not_empty_if_provided
    CHECK (email IS NULL OR email != '');

CREATE INDEX idx_contacts_account_id ON contacts(account_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX idx_contacts_is_deleted ON contacts(is_deleted);
CREATE INDEX idx_contacts_metadata ON contacts USING GIN(metadata);
CREATE INDEX idx_contacts_search_text ON contacts USING GIN(to_tsvector('english', COALESCE(search_text, '')));
CREATE INDEX idx_contacts_account_primary ON contacts(account_id, is_primary);
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- ─── CRM: Leads ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company_name TEXT,
    job_title TEXT,
    lead_source TEXT,
    lead_status lead_status DEFAULT 'new',
    converted_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    converted_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    search_text TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_lead_status ON leads(lead_status);
CREATE INDEX idx_leads_owner_id ON leads(owner_id);
CREATE INDEX idx_leads_converted_account_id ON leads(converted_account_id);
CREATE INDEX idx_leads_is_deleted ON leads(is_deleted);
CREATE INDEX idx_leads_status_owner ON leads(lead_status, owner_id);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- ─── CRM: Opportunities ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    stage opportunity_stage DEFAULT 'prospecting',
    amount NUMERIC(12,2),
    currency TEXT DEFAULT 'USD',
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    actual_close_date DATE,
    lead_source TEXT,
    lost_reason TEXT,
    metadata JSONB DEFAULT '{}',
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opportunities_account_id ON opportunities(account_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_owner_id ON opportunities(owner_id);
CREATE INDEX idx_opportunities_expected_close_date ON opportunities(expected_close_date);
CREATE INDEX idx_opportunities_stage_close ON opportunities(stage, expected_close_date);
CREATE INDEX idx_opportunities_is_deleted ON opportunities(is_deleted);
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- ─── CRM: Activities ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_type activity_type NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    activity_date TIMESTAMPTZ DEFAULT NOW(),
    duration_minutes INTEGER CHECK (duration_minutes > 0),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    owner_id UUID NOT NULL REFERENCES users(id),
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_owner_id ON activities(owner_id);
CREATE INDEX idx_activities_contact_id ON activities(contact_id);
CREATE INDEX idx_activities_account_id ON activities(account_id);
CREATE INDEX idx_activities_opportunity_id ON activities(opportunity_id);
CREATE INDEX idx_activities_activity_type ON activities(activity_type);
CREATE INDEX idx_activities_activity_date ON activities(activity_date);
CREATE INDEX idx_activities_owner_date ON activities(owner_id, activity_date);
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- ─── CRM: Notes ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}',
    owner_id UUID NOT NULL REFERENCES users(id),
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_entity_type_id ON notes(entity_type, entity_id);
CREATE INDEX idx_notes_owner_id ON notes(owner_id);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- ─── CRM: Cases ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject TEXT NOT NULL,
    description TEXT,
    status case_status DEFAULT 'open',
    priority TEXT DEFAULT 'normal',
    case_origin TEXT,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX idx_cases_account_id ON cases(account_id);
CREATE INDEX idx_cases_priority ON cases(priority);
CREATE INDEX idx_cases_is_deleted ON cases(is_deleted);
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- ─── CRM: Products ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sku TEXT UNIQUE,
    unit_price NUMERIC(12,2),
    cost_price NUMERIC(12,2),
    currency TEXT DEFAULT 'USD',
    product_category TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ─── Triggers ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Change Data Capture Trigger Function ───────────────────────────────
CREATE OR REPLACE FUNCTION notify_table_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO table_changes (table_name, operation, changed_at)
    VALUES (TG_TABLE_NAME, TG_OP, NOW());
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach CDC triggers (STATEMENT-level) to all mutable tables
CREATE TRIGGER notify_users_changes AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH STATEMENT EXECUTE FUNCTION notify_table_change();
CREATE TRIGGER notify_roles_changes AFTER INSERT OR UPDATE OR DELETE ON roles FOR EACH STATEMENT EXECUTE FUNCTION notify_table_change();
CREATE TRIGGER notify_permissions_changes AFTER INSERT OR UPDATE OR DELETE ON permissions FOR EACH STATEMENT EXECUTE FUNCTION notify_table_change();
CREATE TRIGGER notify_events_changes AFTER INSERT OR UPDATE OR DELETE ON events FOR EACH STATEMENT EXECUTE FUNCTION notify_table_change();
CREATE TRIGGER notify_accounts_changes AFTER INSERT OR UPDATE OR DELETE ON accounts FOR EACH STATEMENT EXECUTE FUNCTION notify_table_change();
CREATE TRIGGER notify_contacts_changes AFTER INSERT OR UPDATE OR DELETE ON contacts FOR EACH STATEMENT EXECUTE FUNCTION notify_table_change();
CREATE TRIGGER notify_leads_changes AFTER INSERT OR UPDATE OR DELETE ON leads FOR EACH STATEMENT EXECUTE FUNCTION notify_table_change();
CREATE TRIGGER notify_opportunities_changes AFTER INSERT OR UPDATE OR DELETE ON opportunities FOR EACH STATEMENT EXECUTE FUNCTION notify_table_change();
CREATE TRIGGER notify_activities_changes AFTER INSERT OR UPDATE OR DELETE ON activities FOR EACH STATEMENT EXECUTE FUNCTION notify_table_change();
CREATE TRIGGER notify_notes_changes AFTER INSERT OR UPDATE OR DELETE ON notes FOR EACH STATEMENT EXECUTE FUNCTION notify_table_change();
CREATE TRIGGER notify_cases_changes AFTER INSERT OR UPDATE OR DELETE ON cases FOR EACH STATEMENT EXECUTE FUNCTION notify_table_change();
CREATE TRIGGER notify_products_changes AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH STATEMENT EXECUTE FUNCTION notify_table_change();
