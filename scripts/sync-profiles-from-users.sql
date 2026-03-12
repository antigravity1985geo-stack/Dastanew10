-- ============================================================
-- 🔄 SYNC PROFILES: Ensure profiles match users table
-- ============================================================
-- პრობლემა: სისტემა იყენებს "users" ცხრილს ავტორიზაციისთვის, 
-- მაგრამ RLS პოლიტიკა (get_my_tenant_id) იყენებს "profiles"-ს.
-- ეს სკრიპტი გადაიტანს მონაცემებს "users"-დან "profiles"-ში.
-- ============================================================

-- 1. არსებული მონაცემების სინქრონიზაცია (INSERT missing)
INSERT INTO public.profiles (id, tenant_id, display_name, role)
SELECT 
  id, 
  tenant_id, 
  display_name, 
  role::text
FROM public.users
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

-- 2. ტრიგერი ავტომატური სინქრონიზაციისთვის (users -> profiles)
CREATE OR REPLACE FUNCTION public.handle_user_sync_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, tenant_id, display_name, role)
  VALUES (NEW.id, NEW.tenant_id, NEW.display_name, NEW.role::text)
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

-- 3. ტრიგერი auth.users -> profiles (Supabase Native Auth-ისთვის)
-- ეს დააზღვევს იმ შემთხვევასაც, თუ Custom Auth-ს არ ვიყენებთ
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (NEW.id, NEW.email, 'owner')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
