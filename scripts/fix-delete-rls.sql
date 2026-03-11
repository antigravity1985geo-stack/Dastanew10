-- -------- RLS Fixes for Deletion (Custom Auth) --------
-- These policies allow the custom auth system to delete records 
-- properly when using the anon role.

-- 1. sales table
DROP POLICY IF EXISTS "Allow anonymous and authenticated delete for sales" ON sales;
CREATE POLICY "Allow anonymous and authenticated delete for sales" 
  ON sales FOR DELETE 
  TO anon, authenticated 
  USING (true);

-- 2. products table
DROP POLICY IF EXISTS "Allow anonymous and authenticated delete for products" ON products;
CREATE POLICY "Allow anonymous and authenticated delete for products" 
  ON products FOR DELETE 
  TO anon, authenticated 
  USING (true);

-- 3. purchase_history table
DROP POLICY IF EXISTS "Allow anonymous and authenticated delete for purchase_history" ON purchase_history;
CREATE POLICY "Allow anonymous and authenticated delete for purchase_history" 
  ON purchase_history FOR DELETE 
  TO anon, authenticated 
  USING (true);

-- 4. expenses table
DROP POLICY IF EXISTS "Allow anonymous and authenticated delete for expenses" ON expenses;
CREATE POLICY "Allow anonymous and authenticated delete for expenses" 
  ON expenses FOR DELETE 
  TO anon, authenticated 
  USING (true);

-- 5. audit_logs table (Optional: allow deleting logs if needed)
DROP POLICY IF EXISTS "Allow anonymous and authenticated delete for audit logs" ON audit_logs;
CREATE POLICY "Allow anonymous and authenticated delete for audit logs" 
  ON audit_logs FOR DELETE 
  TO anon, authenticated 
  USING (true);
