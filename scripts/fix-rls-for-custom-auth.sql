-- -------- RLS Fixes for Custom Auth System --------
-- These changes allow the database to function correctly when using a 
-- custom users table instead of Supabase's built-in Auth system.

-- 1. audit_logs table
-- Allow anyone to insert logs (we rely on the app to provide correct user_id)
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;
CREATE POLICY "Allow anonymous and authenticated inserts for audit logs" 
  ON audit_logs FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- Allow anyone to view logs for now (can be restricted further if needed)
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Allow anonymous and authenticated select for audit logs" 
  ON audit_logs FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- 2. sales table
-- Ensure RLS is enabled but policies are flexible for the custom auth flow
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous and authenticated inserts for sales" ON sales;
CREATE POLICY "Allow anonymous and authenticated inserts for sales" 
  ON sales FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous and authenticated select for sales" ON sales;
CREATE POLICY "Allow anonymous and authenticated select for sales" 
  ON sales FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- 3. products table
-- Ensure stock updates work correctly
DROP POLICY IF EXISTS "Allow anonymous and authenticated update for products" ON products;
CREATE POLICY "Allow anonymous and authenticated update for products" 
  ON products FOR UPDATE 
  TO anon, authenticated 
  USING (true);

DROP POLICY IF EXISTS "Allow anonymous and authenticated select for products" ON products;
CREATE POLICY "Allow anonymous and authenticated select for products" 
  ON products FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- 4. expenses table
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON expenses;
CREATE POLICY "Allow anonymous and authenticated select for expenses" 
  ON expenses FOR SELECT 
  TO anon, authenticated 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON expenses;
CREATE POLICY "Allow anonymous and authenticated insert for expenses" 
  ON expenses FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- 5. purchase_history table
DROP POLICY IF EXISTS "Authenticated users can view purchase history" ON purchase_history;
CREATE POLICY "Allow anonymous and authenticated select for purchase_history" 
  ON purchase_history FOR SELECT 
  TO anon, authenticated 
  USING (true);

DROP POLICY IF EXISTS "System can insert purchase history" ON purchase_history;
CREATE POLICY "Allow anonymous and authenticated insert for purchase_history" 
  ON purchase_history FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);
