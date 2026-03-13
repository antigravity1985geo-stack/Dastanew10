-- ============================================================
-- Migration: Returns (პროდუქტის უკან დაბრუნება)
-- ============================================================

-- Returns table
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  refund_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  reason TEXT DEFAULT '',
  employee_id UUID,
  employee_name TEXT DEFAULT '',
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE returns IS 'პროდუქტის უკან დაბრუნებები';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_returns_sale_id ON returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_returns_product_id ON returns(product_id);
CREATE INDEX IF NOT EXISTS idx_returns_tenant_id ON returns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns(created_at DESC);

-- RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view returns"
  ON returns FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert returns"
  ON returns FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger: auto-restore stock on return
CREATE OR REPLACE FUNCTION handle_return_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET quantity = quantity + NEW.quantity WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS returns_stock_trigger ON returns;
CREATE TRIGGER returns_stock_trigger
  AFTER INSERT ON returns
  FOR EACH ROW EXECUTE FUNCTION handle_return_stock();
