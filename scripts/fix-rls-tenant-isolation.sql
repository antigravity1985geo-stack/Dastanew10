-- ============================================================
-- 🔒 RLS FIX: Multi-Tenant Data Isolation
-- ============================================================
-- გაუშვით ეს SQL Supabase Dashboard > SQL Editor-ში
-- ეს სკრიპტი უზრუნველყოფს, რომ თითოეული ტენანტი (კომპანია)
-- მხოლოდ საკუთარ მონაცემებს ხედავდეს.
-- სკრიპტი შეიძლება მრავალჯერ გაეშვას უპრობლემოდ (idempotent).
-- ============================================================

-- ============================================================
-- ნაბიჯი 1: Helper ფუნქცია — მიმდინარე მომხმარებლის tenant_id
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- ნაბიჯი 2: tenant_id ინდექსები (პერფორმანსისთვის)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_tenant_id ON purchase_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_id ON journal_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_tenant_id ON shifts(tenant_id);

-- ============================================================
-- ნაბიჯი 3: ყველა ძველი + ახალი პოლიტიკის წაშლა (სრული გასუფთავება)
-- ============================================================

-- --- products ---
DROP POLICY IF EXISTS "Allow anonymous and authenticated select for products" ON products;
DROP POLICY IF EXISTS "Allow anonymous and authenticated update for products" ON products;
DROP POLICY IF EXISTS "Allow anonymous and authenticated delete for products" ON products;
DROP POLICY IF EXISTS "Allow anonymous and authenticated insert for products" ON products;
DROP POLICY IF EXISTS "Public can view users for auth" ON products;
DROP POLICY IF EXISTS "tenant_select_products" ON products;
DROP POLICY IF EXISTS "tenant_insert_products" ON products;
DROP POLICY IF EXISTS "tenant_update_products" ON products;
DROP POLICY IF EXISTS "tenant_delete_products" ON products;

-- --- sales ---
DROP POLICY IF EXISTS "Allow anonymous and authenticated inserts for sales" ON sales;
DROP POLICY IF EXISTS "Allow anonymous and authenticated select for sales" ON sales;
DROP POLICY IF EXISTS "Allow anonymous and authenticated delete for sales" ON sales;
DROP POLICY IF EXISTS "Allow anonymous and authenticated update for sales" ON sales;
DROP POLICY IF EXISTS "tenant_select_sales" ON sales;
DROP POLICY IF EXISTS "tenant_insert_sales" ON sales;
DROP POLICY IF EXISTS "tenant_update_sales" ON sales;
DROP POLICY IF EXISTS "tenant_delete_sales" ON sales;

-- --- purchase_history ---
DROP POLICY IF EXISTS "Authenticated users can view purchase history" ON purchase_history;
DROP POLICY IF EXISTS "System can insert purchase history" ON purchase_history;
DROP POLICY IF EXISTS "Admins can delete purchase history" ON purchase_history;
DROP POLICY IF EXISTS "Allow anonymous and authenticated select for purchase_history" ON purchase_history;
DROP POLICY IF EXISTS "Allow anonymous and authenticated insert for purchase_history" ON purchase_history;
DROP POLICY IF EXISTS "Allow anonymous and authenticated delete for purchase_history" ON purchase_history;
DROP POLICY IF EXISTS "tenant_select_purchase_history" ON purchase_history;
DROP POLICY IF EXISTS "tenant_insert_purchase_history" ON purchase_history;
DROP POLICY IF EXISTS "tenant_update_purchase_history" ON purchase_history;
DROP POLICY IF EXISTS "tenant_delete_purchase_history" ON purchase_history;

-- --- expenses ---
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON expenses;
DROP POLICY IF EXISTS "Admins can delete expenses" ON expenses;
DROP POLICY IF EXISTS "Allow anonymous and authenticated select for expenses" ON expenses;
DROP POLICY IF EXISTS "Allow anonymous and authenticated insert for expenses" ON expenses;
DROP POLICY IF EXISTS "Allow anonymous and authenticated delete for expenses" ON expenses;
DROP POLICY IF EXISTS "tenant_select_expenses" ON expenses;
DROP POLICY IF EXISTS "tenant_insert_expenses" ON expenses;
DROP POLICY IF EXISTS "tenant_update_expenses" ON expenses;
DROP POLICY IF EXISTS "tenant_delete_expenses" ON expenses;

-- --- employees ---
DROP POLICY IF EXISTS "Authenticated users can view employees" ON employees;
DROP POLICY IF EXISTS "Admins can manage employees" ON employees;
DROP POLICY IF EXISTS "Allow anonymous and authenticated select for employees" ON employees;
DROP POLICY IF EXISTS "Allow anonymous and authenticated insert for employees" ON employees;
DROP POLICY IF EXISTS "tenant_select_employees" ON employees;
DROP POLICY IF EXISTS "tenant_insert_employees" ON employees;
DROP POLICY IF EXISTS "tenant_update_employees" ON employees;
DROP POLICY IF EXISTS "tenant_delete_employees" ON employees;

-- --- audit_logs ---
DROP POLICY IF EXISTS "Allow anonymous and authenticated inserts for audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow anonymous and authenticated select for audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow anonymous and authenticated delete for audit logs" ON audit_logs;
DROP POLICY IF EXISTS "tenant_select_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "tenant_insert_audit_logs" ON audit_logs;

-- --- journal_entries ---
DROP POLICY IF EXISTS "Allow anonymous and authenticated select for journal_entries" ON journal_entries;
DROP POLICY IF EXISTS "Allow anonymous and authenticated insert for journal_entries" ON journal_entries;
DROP POLICY IF EXISTS "tenant_select_journal_entries" ON journal_entries;
DROP POLICY IF EXISTS "tenant_insert_journal_entries" ON journal_entries;

-- --- shifts ---
DROP POLICY IF EXISTS "Allow anonymous and authenticated select for shifts" ON shifts;
DROP POLICY IF EXISTS "Allow anonymous and authenticated insert for shifts" ON shifts;
DROP POLICY IF EXISTS "Allow anonymous and authenticated update for shifts" ON shifts;
DROP POLICY IF EXISTS "tenant_select_shifts" ON shifts;
DROP POLICY IF EXISTS "tenant_insert_shifts" ON shifts;
DROP POLICY IF EXISTS "tenant_update_shifts" ON shifts;

-- --- profiles ---
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "users_select_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;

-- --- tenants ---
DROP POLICY IF EXISTS "Users can view own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can create tenant" ON tenants;
DROP POLICY IF EXISTS "users_select_own_tenant" ON tenants;
DROP POLICY IF EXISTS "users_insert_tenant" ON tenants;

-- ============================================================
-- ნაბიჯი 4: ახალი RLS პოლიტიკები — tenant_id ფილტრით
-- ============================================================

-- 📦 PRODUCTS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_select_products" ON products FOR SELECT TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_insert_products" ON products FOR INSERT TO authenticated WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_update_products" ON products FOR UPDATE TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_delete_products" ON products FOR DELETE TO authenticated USING (tenant_id = get_my_tenant_id());

-- 💰 SALES
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_select_sales" ON sales FOR SELECT TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_insert_sales" ON sales FOR INSERT TO authenticated WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_update_sales" ON sales FOR UPDATE TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_delete_sales" ON sales FOR DELETE TO authenticated USING (tenant_id = get_my_tenant_id());

-- 📋 PURCHASE_HISTORY
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_select_purchase_history" ON purchase_history FOR SELECT TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_insert_purchase_history" ON purchase_history FOR INSERT TO authenticated WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_update_purchase_history" ON purchase_history FOR UPDATE TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_delete_purchase_history" ON purchase_history FOR DELETE TO authenticated USING (tenant_id = get_my_tenant_id());

-- 💸 EXPENSES
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_select_expenses" ON expenses FOR SELECT TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_insert_expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_update_expenses" ON expenses FOR UPDATE TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_delete_expenses" ON expenses FOR DELETE TO authenticated USING (tenant_id = get_my_tenant_id());

-- 👥 EMPLOYEES
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_select_employees" ON employees FOR SELECT TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_insert_employees" ON employees FOR INSERT TO authenticated WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_update_employees" ON employees FOR UPDATE TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_delete_employees" ON employees FOR DELETE TO authenticated USING (tenant_id = get_my_tenant_id());

-- 📝 AUDIT_LOGS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_select_audit_logs" ON audit_logs FOR SELECT TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_insert_audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (tenant_id = get_my_tenant_id());

-- 📊 JOURNAL_ENTRIES
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_select_journal_entries" ON journal_entries FOR SELECT TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_insert_journal_entries" ON journal_entries FOR INSERT TO authenticated WITH CHECK (tenant_id = get_my_tenant_id());

-- ⏰ SHIFTS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_select_shifts" ON shifts FOR SELECT TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_insert_shifts" ON shifts FOR INSERT TO authenticated WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_update_shifts" ON shifts FOR UPDATE TO authenticated USING (tenant_id = get_my_tenant_id());

-- 👤 PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "users_insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- 🏢 TENANTS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_tenant" ON tenants FOR SELECT TO authenticated USING (id = get_my_tenant_id());
CREATE POLICY "users_insert_tenant" ON tenants FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

-- ============================================================
-- ✅ DONE!
-- ============================================================
-- ყველა ცხრილი ახლა tenant_id-ით არის დაცული.
-- თითოეული მომხმარებელი მხოლოდ საკუთარი კომპანიის
-- მონაცემებს ხედავს და აკეთებს ცვლილებებს.
-- ============================================================
