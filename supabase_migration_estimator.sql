-- ============================================================
-- CoreX — Estimateur de Matériaux
-- Migration: estimation_sheets + estimation_items
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Estimation sheets (one estimate per project per revision)
CREATE TABLE IF NOT EXISTS estimation_sheets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  notes       TEXT,
  status      TEXT NOT NULL DEFAULT 'Brouillon'
                CHECK (status IN ('Brouillon', 'Validé', 'Archivé')),
  input_data  JSONB,
  categories  TEXT[],
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- In case table already exists, ensure the new columns are added
ALTER TABLE estimation_sheets ADD COLUMN IF NOT EXISTS input_data JSONB;
ALTER TABLE estimation_sheets ADD COLUMN IF NOT EXISTS categories TEXT[];

-- 2. Line items within an estimation sheet
CREATE TABLE IF NOT EXISTS estimation_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id        UUID NOT NULL REFERENCES estimation_sheets(id) ON DELETE CASCADE,
  material_name   TEXT NOT NULL,
  category        TEXT,          -- e.g. Gros œuvre, Menuiserie, Électricité…
  unit            TEXT NOT NULL, -- m², m³, kg, unité, ml, T…
  quantity        NUMERIC NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_price      NUMERIC NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_price     NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes           TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Auto-update updated_at on estimation_sheets
CREATE OR REPLACE FUNCTION update_estimation_sheet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_estimation_sheets_updated_at ON estimation_sheets;
CREATE TRIGGER trg_estimation_sheets_updated_at
  BEFORE UPDATE ON estimation_sheets
  FOR EACH ROW EXECUTE FUNCTION update_estimation_sheet_updated_at();

-- 4. Enable Row Level Security
ALTER TABLE estimation_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimation_items  ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — estimation_sheets
-- Admins: full access
CREATE POLICY "admins_all_estimation_sheets"
  ON estimation_sheets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Workers: read-only
CREATE POLICY "workers_read_estimation_sheets"
  ON estimation_sheets FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 6. RLS Policies — estimation_items
CREATE POLICY "admins_all_estimation_items"
  ON estimation_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "workers_read_estimation_items"
  ON estimation_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_estimation_sheets_project_id
  ON estimation_sheets(project_id);

CREATE INDEX IF NOT EXISTS idx_estimation_items_sheet_id
  ON estimation_items(sheet_id, sort_order);
