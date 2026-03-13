-- Migration: Inventory Sessions & Counts

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create table for inventory_sessions
CREATE TABLE IF NOT EXISTS inventory_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    employee_id UUID,
    employee_name TEXT,
    notes TEXT,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create table for inventory_counts
CREATE TABLE IF NOT EXISTS inventory_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    expected_qty INT NOT NULL,
    counted_qty INT NOT NULL,
    variance INT NOT NULL,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Set up Row Level Security (RLS)
ALTER TABLE inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for inventory_sessions
CREATE POLICY "Authenticated users can view inventory_sessions" ON inventory_sessions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert inventory_sessions" ON inventory_sessions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory_sessions" ON inventory_sessions
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete inventory_sessions" ON inventory_sessions
    FOR DELETE TO authenticated USING (true);

-- 5. Create policies for inventory_counts
CREATE POLICY "Authenticated users can view inventory_counts" ON inventory_counts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert inventory_counts" ON inventory_counts
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory_counts" ON inventory_counts
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete inventory_counts" ON inventory_counts
    FOR DELETE TO authenticated USING (true);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_sessions_tenant ON inventory_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_session ON inventory_counts(session_id);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_tenant ON inventory_counts(tenant_id);
