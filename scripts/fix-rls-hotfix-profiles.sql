-- ============================================================
-- 🔧 RLS HOTFIX: profiles + tenants ახალი რეგისტრაციისთვის
-- ============================================================
-- პრობლემა: რეგისტრაციის დროს profiles.upsert ვერ ხერხდება,
-- რადგან RLS-ში UPDATE პოლიტიკა არ იყო.
-- ასევე tenants-ის RLS ბლოკავს SELECT-ს ახალი მომხმარებლისთვის
-- (რომელსაც ჯერ tenant_id არ აქვს profiles-ში).
-- ============================================================

-- 1. profiles: უნდა შეეძლოს upsert (INSERT + UPDATE)
DROP POLICY IF EXISTS "users_select_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;

-- SELECT: მომხმარებელი ხედავს მხოლოდ საკუთარ პროფილს
CREATE POLICY "users_select_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- INSERT: მომხმარებელს შეუძლია საკუთარი პროფილი შექმნას
CREATE POLICY "users_insert_own_profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: მომხმარებელს შეუძლია საკუთარი პროფილი განაახლოს (tenant_id ჩათვლით)
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. tenants: ახალი მომხმარებლისთვის INSERT და SELECT
DROP POLICY IF EXISTS "users_select_own_tenant" ON tenants;
DROP POLICY IF EXISTS "users_insert_tenant" ON tenants;

-- SELECT: მომხმარებელზე მიბმული ტენანტი ან ტენანტი რომლის owner-იც ის არის
CREATE POLICY "users_select_own_tenant" ON tenants
  FOR SELECT TO authenticated
  USING (
    id = get_my_tenant_id()
    OR owner_id = auth.uid()
  );

-- INSERT: მომხმარებელს შეუძლია ტენანტის შექმნა (საკუთარი owner_id-ით)
CREATE POLICY "users_insert_tenant" ON tenants
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- 3. ახლავე გავასწოროთ არსებული პრობლემა:
-- თუ მომხმარებელს აქვს ტენანტი შექმნილი (tenants.owner_id), მაგრამ
-- profiles.tenant_id ცარიელია, მაშინ დავაკავშიროთ ავტომატურად.
UPDATE profiles p
SET tenant_id = t.id
FROM tenants t
WHERE t.owner_id = p.id
  AND p.tenant_id IS NULL;

-- ============================================================
-- ✅ გაშვების შემდეგ, გთხოვთ დაარეფრეშოთ გვერდი!
-- ============================================================
