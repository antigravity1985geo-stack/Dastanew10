-- ============================================================
-- 🔄 SYNC PROFILES: Ensure profiles match users table (V2 - Fixed Constraints)
-- ============================================================

-- 1. Ensure 'owner' role exists in the enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'owner';

-- 2. არსებული მონაცემების სინქრონიზაცია (INSERT with username)
INSERT INTO public.profiles (id, username, display_name, role, tenant_id)
SELECT 
  id, 
  username, -- დაემატა username
  display_name, 
  role::text::public.user_role,
  tenant_id
FROM public.users
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  tenant_id = EXCLUDED.tenant_id;

-- 3. ტრიგერი ავტომატური სინქრონიზაციისთვის (users -> profiles)
CREATE OR REPLACE FUNCTION public.handle_user_sync_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, role, tenant_id)
  VALUES (
    NEW.id, 
    NEW.username, -- დაემატა username
    NEW.display_name, 
    NEW.role::text::public.user_role,
    NEW.tenant_id
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    tenant_id = EXCLUDED.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_sync_to_profile ON public.users;
CREATE TRIGGER on_user_sync_to_profile
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_sync_to_profile();

-- 4. ტრიგერი auth.users -> profiles
-- აქ username-სთვის ვიყენებთ email-ს (რადგან NOT NULL-ია)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, role)
  VALUES (
    NEW.id, 
    NEW.email, -- username = email
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), 
    'owner'::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
