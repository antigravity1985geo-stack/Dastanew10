-- -------- RLS Fixes & Schema Updates (v3) --------

-- 1. Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_level INTEGER;
COMMENT ON COLUMN products.wholesale_price IS 'საბითუმო ფასი';
COMMENT ON COLUMN products.min_stock_level IS 'მინიმალური ნაშთი (განგაშისთვის)';

-- 2. Add missing columns to purchase_history table
ALTER TABLE purchase_history ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GEL';
ALTER TABLE purchase_history ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,4) DEFAULT 1;

-- 3. Add missing columns to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GEL';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,4) DEFAULT 1;

-- 4. Disable redundant database trigger for purchase history
DROP TRIGGER IF EXISTS products_purchase_log ON products;

-- 5. Update RLS policies to allow deletion for anon role (Custom Auth)

-- sales table
DROP POLICY IF EXISTS "Allow anonymous and authenticated delete for sales" ON sales;
CREATE POLICY "Allow anonymous and authenticated delete for sales" 
  ON sales FOR DELETE 
  TO anon, authenticated 
  USING (true);

-- products table
DROP POLICY IF EXISTS "Allow anonymous and authenticated delete for products" ON products;
CREATE POLICY "Allow anonymous and authenticated delete for products" 
  ON products FOR DELETE 
  TO anon, authenticated 
  USING (true);

-- purchase_history table
DROP POLICY IF EXISTS "Allow anonymous and authenticated delete for purchase_history" ON purchase_history;
CREATE POLICY "Allow anonymous and authenticated delete for purchase_history" 
  ON purchase_history FOR DELETE 
  TO anon, authenticated 
  USING (true);

-- expenses table
DROP POLICY IF EXISTS "Allow anonymous and authenticated delete for expenses" ON expenses;
CREATE POLICY "Allow anonymous and authenticated delete for expenses" 
  ON expenses FOR DELETE 
  TO anon, authenticated 
  USING (true);

-- audit_logs table
DROP POLICY IF EXISTS "Allow anonymous and authenticated delete for audit logs" ON audit_logs;
CREATE POLICY "Allow anonymous and authenticated delete for audit logs" 
  ON audit_logs FOR DELETE 
  TO anon, authenticated 
  USING (true);
