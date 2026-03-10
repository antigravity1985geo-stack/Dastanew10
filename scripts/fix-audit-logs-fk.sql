-- -------- Fix Audit Logs Foreign Key --------
-- This script fixes the issue where audit_logs table references auth.users 
-- instead of the custom public.users table used by the application.

-- 1. Identify and drop the existing constraint
-- The constraint name is usually 'audit_logs_user_id_fkey'
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- 2. Ensure user_id column is the correct type and nullable
ALTER TABLE audit_logs ALTER COLUMN user_id TYPE UUID;
ALTER TABLE audit_logs ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add the correct foreign key constraint pointing to public.users
ALTER TABLE audit_logs 
  ADD CONSTRAINT audit_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Update RLS policies to ensure inserts work with custom auth
-- (This matches the proposed fix in fix-rls-for-custom-auth.sql)
DROP POLICY IF EXISTS "Allow anonymous and authenticated inserts for audit logs" ON audit_logs;
CREATE POLICY "Allow anonymous and authenticated inserts for audit logs" 
  ON audit_logs FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous and authenticated select for audit logs" ON audit_logs;
CREATE POLICY "Allow anonymous and authenticated select for audit logs" 
  ON audit_logs FOR SELECT 
  TO anon, authenticated 
  USING (true);
