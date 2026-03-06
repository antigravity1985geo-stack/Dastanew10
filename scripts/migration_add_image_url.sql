-- ==========================================
-- პროდუქციის ფოტოების მხარდაჭერის დამატება
-- გაუშვით Supabase SQL Editor-ში
-- ==========================================

-- 1. image_url სვეტის დამატება products ცხრილში
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Storage bucket-ის შექმნა
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. წაშალეთ ძველი policies (თუ არსებობს)
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all to read product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all to upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all to update product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all to delete product images" ON storage.objects;

-- 4. ყველას შეუძლია ფოტოების ნახვა
CREATE POLICY "Allow all to read product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 5. ყველას შეუძლია ფოტოების ატვირთვა (anon + authenticated)
CREATE POLICY "Allow all to upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- 6. ყველას შეუძლია ფოტოების განახლება
CREATE POLICY "Allow all to update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

-- 7. ყველას შეუძლია ფოტოების წაშლა
CREATE POLICY "Allow all to delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');
