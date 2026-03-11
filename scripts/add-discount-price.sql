-- ==========================================
-- ფასდაკლების (აქციის) მხარდაჭერის დამატება (განახლებული)
-- გაუშვით Supabase SQL Editor-ში
-- ==========================================

-- 1. discount_price სვეტის დამატება products ცხრილში
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price NUMERIC(12, 2);

-- 2. წაშალეთ ძველი ხედი (საჭიროა, რადგან სვეტების სტრუქტურა იცვლება)
DROP VIEW IF EXISTS v_inventory_summary;

-- 3. შექმენით ახალი ხედი განახლებული სვეტებით
CREATE OR REPLACE VIEW v_inventory_summary AS
SELECT
  p.id,
  p.name,
  p.category_name,
  p.purchase_price,
  p.sale_price,
  p.discount_price, -- ახალი სვეტი
  p.quantity,
  (p.purchase_price * p.quantity) AS total_purchase_value,
  (p.sale_price * p.quantity) AS total_sale_value,
  ((p.sale_price - p.purchase_price) * p.quantity) AS potential_profit,
  CASE WHEN p.purchase_price > 0
    THEN ROUND(((p.sale_price - p.purchase_price) / p.purchase_price * 100)::numeric, 1)
    ELSE 0
  END AS margin_percent,
  p.client,
  p.created_at,
  p.updated_at
FROM products p
ORDER BY p.name;
