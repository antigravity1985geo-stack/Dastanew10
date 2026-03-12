-- ============================================================
-- 🔄 SYNC PROFILES: Ensure profiles match users table (FIXED)
-- ============================================================

-- 1. Ensure 'owner' role exists in the enum (if it's missing)
-- შენიშვნა: ALTER TYPE ADD VALUE არ შეიძლება გაეშვას ტრანზაქციის შიგნით (DO $$ ბლოკში).
-- ამიტომ ცალკე ვუშვებთ, თუ დაერორდება 'already exists' - არაუშავს.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'owner';

-- 2. არსებული მონაცემების სინქრონიზაცია
-- ვიყენებთ ::text::user_role ორმაგ ქასთს, რომ ნებისმიერი ფორმატის 'role' სწორად ჩაიწეროს
INSERT INTO public.profiles (id, tenant_id, display_name, role)
SELECT 
  id, 
  tenant_id, 
  display_name, 
  role::text::public.user_role
FROM public.users
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

-- 3. ტრიგერი ავტომატური სინქრონიზაციისთვის (users -> profiles)
CREATE OR REPLACE FUNCTION public.handle_user_sync_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, tenant_id, display_name, role)
  VALUES (NEW.id, NEW.tenant_id, NEW.display_name, NEW.role::text::public.user_role)
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_sync_to_profile ON public.users;
CREATE TRIGGER on_user_sync_to_profile
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_sync_to_profile();

-- 4. ტრიგერი auth.users -> profiles
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (NEW.id, NEW.email, 'owner'::public.user_role)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
