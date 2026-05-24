-- ============================================================
-- MIGRATION: Add admin_owner_id for company-scoped data access
-- Run this in Supabase Dashboard → SQL Editor
-- Safe to re-run: all CREATE POLICY are preceded by DROP IF EXISTS
-- ============================================================

-- 1. Add admin_owner_id to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_owner_id UUID REFERENCES auth.users(id);

-- 2. Backfill: root admins (no creator) → admin_owner_id = own id
UPDATE profiles
  SET admin_owner_id = id
  WHERE admin_owner_id IS NULL AND (created_by IS NULL OR created_by = id);

-- 3. Backfill: users created by someone → inherit creator's admin_owner_id
UPDATE profiles AS p
  SET admin_owner_id = creator.admin_owner_id
  FROM profiles AS creator
  WHERE p.created_by = creator.id
    AND p.admin_owner_id IS NULL
    AND creator.admin_owner_id IS NOT NULL;

-- Run again for deeper chains
UPDATE profiles AS p
  SET admin_owner_id = creator.admin_owner_id
  FROM profiles AS creator
  WHERE p.created_by = creator.id
    AND p.admin_owner_id IS NULL
    AND creator.admin_owner_id IS NOT NULL;

-- 4. Fallback: any still-null → set to own id
UPDATE profiles
  SET admin_owner_id = id
  WHERE admin_owner_id IS NULL;

-- 5. Make NOT NULL
ALTER TABLE profiles
  ALTER COLUMN admin_owner_id SET NOT NULL;

-- ============================================================
-- Helper function
-- ============================================================
CREATE OR REPLACE FUNCTION get_admin_owner_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT admin_owner_id FROM profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- RLS: tasks
-- ============================================================
DROP POLICY IF EXISTS "Admins full access on their tasks"   ON tasks;
DROP POLICY IF EXISTS "Admins can view their own tasks"     ON tasks;
DROP POLICY IF EXISTS "Admins can insert tasks"             ON tasks;
DROP POLICY IF EXISTS "Admins can update their tasks"       ON tasks;
DROP POLICY IF EXISTS "Admins can delete their tasks"       ON tasks;
DROP POLICY IF EXISTS "Users can view assigned tasks"       ON tasks;
DROP POLICY IF EXISTS "Users can update assigned tasks"     ON tasks;
DROP POLICY IF EXISTS "Admins see company tasks"            ON tasks;
DROP POLICY IF EXISTS "Workers see assigned tasks"          ON tasks;
DROP POLICY IF EXISTS "Workers update assigned tasks"       ON tasks;

CREATE POLICY "Admins see company tasks" ON tasks
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles admin_p
      WHERE admin_p.id = auth.uid()
        AND admin_p.role = 'admin'
        AND EXISTS (
          SELECT 1 FROM profiles creator_p
          WHERE creator_p.id = tasks.created_by
            AND creator_p.admin_owner_id = admin_p.admin_owner_id
        )
    )
  );

CREATE POLICY "Workers see assigned tasks" ON tasks
  FOR SELECT
  USING (
    assigned_to = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Workers update assigned tasks" ON tasks
  FOR UPDATE
  USING (
    assigned_to = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- RLS: projects
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage projects"          ON projects;
DROP POLICY IF EXISTS "Users can view projects"             ON projects;
DROP POLICY IF EXISTS "Admins full access on their projects" ON projects;
DROP POLICY IF EXISTS "Admins see company projects"         ON projects;
DROP POLICY IF EXISTS "Workers view projects"               ON projects;

CREATE POLICY "Admins see company projects" ON projects
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles admin_p
      WHERE admin_p.id = auth.uid()
        AND admin_p.role = 'admin'
        AND EXISTS (
          SELECT 1 FROM profiles creator_p
          WHERE creator_p.id = projects.created_by
            AND creator_p.admin_owner_id = admin_p.admin_owner_id
        )
    )
  );

CREATE POLICY "Workers view projects" ON projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM profiles creator_p
          WHERE creator_p.id = projects.created_by
            AND creator_p.admin_owner_id = p.admin_owner_id
        )
    )
  );

-- ============================================================
-- RLS: invoices (incoming)
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage invoices"          ON invoices;
DROP POLICY IF EXISTS "Admins full access on their invoices" ON invoices;
DROP POLICY IF EXISTS "Admins see company invoices"         ON invoices;

CREATE POLICY "Admins see company invoices" ON invoices
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles admin_p
      WHERE admin_p.id = auth.uid()
        AND admin_p.role = 'admin'
        AND EXISTS (
          SELECT 1 FROM profiles creator_p
          WHERE creator_p.id = invoices.created_by
            AND creator_p.admin_owner_id = admin_p.admin_owner_id
        )
    )
  );

-- ============================================================
-- RLS: invoices_outgoing
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage outgoing invoices"            ON invoices_outgoing;
DROP POLICY IF EXISTS "Admins full access on their outgoing invoices"  ON invoices_outgoing;
DROP POLICY IF EXISTS "Admins see company outgoing invoices"           ON invoices_outgoing;

CREATE POLICY "Admins see company outgoing invoices" ON invoices_outgoing
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles admin_p
      WHERE admin_p.id = auth.uid()
        AND admin_p.role = 'admin'
        AND EXISTS (
          SELECT 1 FROM profiles creator_p
          WHERE creator_p.id = invoices_outgoing.created_by
            AND creator_p.admin_owner_id = admin_p.admin_owner_id
        )
    )
  );

-- ============================================================
-- RLS: stock_items
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage stock"             ON stock_items;
DROP POLICY IF EXISTS "Admins full access on their stock"   ON stock_items;
DROP POLICY IF EXISTS "Admins see company stock"            ON stock_items;

CREATE POLICY "Admins see company stock" ON stock_items
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles admin_p
      WHERE admin_p.id = auth.uid()
        AND admin_p.role = 'admin'
        AND EXISTS (
          SELECT 1 FROM profiles creator_p
          WHERE creator_p.id = stock_items.created_by
            AND creator_p.admin_owner_id = admin_p.admin_owner_id
        )
    )
  );

-- ============================================================
-- RLS: profiles
-- ============================================================
DROP POLICY IF EXISTS "Users can view profiles in their company" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles"               ON profiles;
DROP POLICY IF EXISTS "Users view company profiles"              ON profiles;
DROP POLICY IF EXISTS "Admins manage company profiles"           ON profiles;

CREATE POLICY "Users view company profiles" ON profiles
  FOR SELECT
  USING (
    admin_owner_id = (SELECT admin_owner_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins manage company profiles" ON profiles
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      AND admin_owner_id = (SELECT admin_owner_id FROM profiles WHERE id = auth.uid())
    )
  );

-- ============================================================
-- 6. Trigger Function: Update handle_new_user to populate admin_owner_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, created_by, admin_owner_id)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''), 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'worker'),
    NULLIF(new.raw_user_meta_data->>'created_by', '')::uuid,
    COALESCE(
      NULLIF(new.raw_user_meta_data->>'admin_owner_id', '')::uuid,
      new.id
    )
  );
  RETURN new;
END;
$function$;

-- ============================================================
-- 7. Referential Integrity: Alter foreign keys to support SET NULL on delete
-- ============================================================
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;
ALTER TABLE tasks ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;
ALTER TABLE tasks ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_uploaded_by_fkey;
ALTER TABLE invoices ADD CONSTRAINT invoices_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE invoices_outgoing DROP CONSTRAINT IF EXISTS invoices_outgoing_created_by_fkey;
ALTER TABLE invoices_outgoing ADD CONSTRAINT invoices_outgoing_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_created_by_fkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

