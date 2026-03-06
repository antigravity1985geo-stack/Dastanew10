-- ============================================================
-- საწყობის მართვის სისტემა - Supabase SQL Update Schema
-- ============================================================
-- გაუშვით ეს SQL Supabase Dashboard > SQL Editor-ში
-- ეს არის ახალი ფუნქციონალის დამატება: ხარჯები და ნისიები
-- ============================================================

-- 1. გაყიდვების ცხრილში გადახდილი თანხის და სტატუსის დამატება
ALTER TABLE sales ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'paid';

-- არსებულ გაყიდვებზე ჩავთვალოთ რომ სრულად გადახდილია
UPDATE sales SET paid_amount = total_amount WHERE paid_amount = 0;

-- 2. ხარჯების (Expenses) ცხრილის შექმნა
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'სხვა',
  description TEXT DEFAULT '',
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE expenses IS 'ფინანსური ხარჯები';

-- ინდექსები ხარჯებისთვის
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- RLS (უსაფრთხოების წესები) ხარჯებისთვის
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins can delete expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
