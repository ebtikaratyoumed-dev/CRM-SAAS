-- SQL Migration to create stock_items table

CREATE TABLE IF NOT EXISTS stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all stock items" 
ON stock_items FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert stock items" 
ON stock_items FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update stock items" 
ON stock_items FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete stock items" 
ON stock_items FOR DELETE 
USING (auth.role() = 'authenticated');
