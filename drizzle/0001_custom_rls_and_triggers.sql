-- Custom Supabase Migration: RLS, Triggers, and Auth Sync

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 2. Auth Sync Trigger (Sync auth.users to public.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Auto-update updated_at Trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_updated_at_roles BEFORE UPDATE ON roles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_updated_at_accounts BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_updated_at_contacts BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- 4. Basic RLS Policies (More complex ones handled by application code)
-- Users can read their own data, superusers can read all
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id OR is_superuser = true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Roles and Permissions are readable by authenticated users
CREATE POLICY "Authenticated users can read roles" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read permissions" ON permissions FOR SELECT TO authenticated USING (true);

-- Events are insertable by authenticated users, readable by superusers
CREATE POLICY "Users can insert events" ON events FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);
CREATE POLICY "Superusers can read events" ON events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superuser = true)
);

-- Accounts and Contacts have basic owner-based policies (POC)
CREATE POLICY "Users can read owned accounts" ON accounts FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update owned accounts" ON accounts FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can read owned contacts" ON contacts FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert contacts" ON contacts FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update owned contacts" ON contacts FOR UPDATE USING (auth.uid() = owner_id);

-- 5. Table Change Triggers for Realtime
CREATE OR REPLACE FUNCTION public.notify_table_change()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.table_changes (table_name, operation)
  VALUES (TG_TABLE_NAME, TG_OP);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_accounts_change AFTER INSERT OR UPDATE OR DELETE ON accounts FOR EACH STATEMENT EXECUTE PROCEDURE notify_table_change();
CREATE TRIGGER notify_contacts_change AFTER INSERT OR UPDATE OR DELETE ON contacts FOR EACH STATEMENT EXECUTE PROCEDURE notify_table_change();
