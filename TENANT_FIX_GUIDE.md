# 🚨 TENANT ISOLATION FIX GUIDE

> **პრობლემა:** ახალი მომხმარებლის რეგისტრაციისას tenant (კომპანია) ვერ იქმნება ან პროფილს ვერ ეკვრის. 
> ეს იწვევს "Missing tenant_id" შეცდომას და მომხმარებელი ვერ ამატებს პროდუქციას.
> **ეს დოკუმენტი შექმნილია სხვა AI-ს მიერ გამოსაყენებლად.**

---

## 📊 მიმდინარე მდგომარეობა (2026-03-12)

### Supabase Project
- **Project ID:** `fkzenrulvbpmmpukeyxx`
- **DB Host:** `db.fkzenrulvbpmmpukeyxx.supabase.co`

### მომხმარებლები და ტენანტები (გასწორებული)
| Email | User ID | Tenant | Tenant ID | Role |
|---|---|---|---|---|---|
| j19mt85@gmail.com | 697f1b4f | DASTA CLOUD JR | 9cd08c2b-6f62-46f8-8111-9cb15bd8faae | admin |
| dastadusta@gmail.com | 6ed62d2f | Woodpoint | bb9ddaa1-09c7-4b8f-98d6-27612c514f9e | owner |
| antigravity1985geo@gmail.com | 051a51c8 | ❌ არ აქვს! | NULL | owner |

### Auth Users ვინც პროფილიც არ აქვს
| Email | User ID |
|---|---|
| jabamtsariashvili085@gmail.com | a09f778c |
| hernanhese@gmail.com | 57142cc7 |

---

## 🔴 პრობლემის ძირი (Root Cause)

რეგისტრაციის ფლოუში 3 ნაბიჯია:

1. **`supabase.auth.signUp()`** — ქმნის auth user-ს
2. **`handle_new_auth_user` trigger** — ავტომატურად ქმნის `profiles` ჩანაწერს **TENANT_ID-ის გარეშე**
3. **Client-side code** — ქმნის tenant-ს და ცდილობს profile-ის UPDATE-ს tenant_id-ით

**პრობლემა Step 3-ში:** profile UPDATE ჩუმად ფეილდება. შესაძლო მიზეზები:
- RLS policy `profiles_update_own` მოითხოვს `id = auth.uid()`, მაგრამ signUp-ის შემდეგ session შეიძლება ჯერ სრულად არ იყოს ესტაბლიშდ
- `handle_new_auth_user` trigger-ის ON CONFLICT DO NOTHING ნიშნავს რომ თუ race condition-ია, შეიძლება profile სხვანაირად შეიქმნას
- Supabase email confirmation-მა შეიძლება დააბლოკოს session-ი signUp-ის შემდეგ

---

## ✅ რა უნდა გაკეთდეს

### 1. ფიქსი: `handle_new_auth_user` DB Trigger (კრიტიკული)

ტრიგერმა თავადვე უნდა შექმნას tenant და მიაკვროს profile-ს, რომ client-side-ზე არ იყოს დამოკიდებული.

**მიმდინარე trigger (პრობლემური):**
```sql
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), 
    'owner'::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**შემოთავაზებული ახალი trigger:**
```sql
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger AS $$
DECLARE
  new_tenant_id uuid;
  company_name text;
  company_slug text;
BEGIN
  -- Get company name from user metadata (passed during registration)
  company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', '');
  
  -- Only create tenant if company_name was provided (registration flow, not invite flow)
  IF company_name != '' THEN
    -- Generate slug from company name
    company_slug := COALESCE(
      NEW.raw_user_meta_data->>'company_slug',
      lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 4)
    );
    
    -- Create tenant
    INSERT INTO public.tenants (name, slug, owner_id)
    VALUES (company_name, company_slug, NEW.id)
    RETURNING id INTO new_tenant_id;
  END IF;

  -- Create profile with tenant_id
  INSERT INTO public.profiles (id, username, display_name, role, tenant_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), 
    'owner'::public.user_role,
    new_tenant_id
  )
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = COALESCE(EXCLUDED.tenant_id, profiles.tenant_id),
    display_name = EXCLUDED.display_name;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. ფიქსი: `lib/auth.ts` — register() მეთოდი

კომპანიის სახელი და slug უნდა გადაეცეს `signUp`-ის `raw_user_meta_data`-ში, რომ trigger-მა გამოიყენოს:

**ფაილი:** `lib/auth.ts`, ხაზი ~208-215

**მიმდინარე კოდი:**
```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { display_name: displayName },
  },
});
```

**შესაცვლელი:**
```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { 
      display_name: displayName,
      company_name: companyName,
      company_slug: finalSlug,  // finalSlug-ის გენერაცია signUp-ის წინ გადაიტანე
    },
  },
});
```

ამის შემდეგ **client-side tenant creation (ხაზი 238-286) შეიძლება წაიშალოს ან დარჩეს fallback-ად**, რადგან trigger უკვე შექმნის.

შეცვლილი register() ფლოუ:
1. slug-ის გენერაცია
2. `signUp()` — company_name/slug metadata-ში
3. trigger ქმნის tenant-ს + profile-ს
4. Client-side: **შემოწმება** — თუ tenant არ შეიქმნა (fallback), მაშინ client-ვე ქმნის
5. `loadProfile()` — state-ის ჩატვირთვა

### 3. Supabase Email Confirmation-ის შემოწმება

თუ Supabase-ზე email confirmation ჩართულია, signUp-ის შემდეგ session არ იქმნება (user უნდა ელ-ფოსტას დაადასტუროს). ამ შემთხვევაში:
- Client-side tenant creation **ვერ იმუშავებს** (არ არის session → RLS არ უშვებს)
- Trigger (SECURITY DEFINER) **იმუშავებს** RLS-ის გარეშე

**შესამოწმებელი:** Supabase Dashboard → Authentication → Settings → Email confirmations. 
თუ ჩართულია, trigger-based approach აუცილებელია.

### 4. RLS Policies-ის ვალიდაცია

შეამოწმე რომ ყველა ტაბულა (products, purchases, categories, expenses და ა.შ.) იყენებს `tenant_id` ფილტრს RLS-ში:

```sql
-- ყველა policy-ის ნახვა
SELECT pc.relname as table_name, pol.polname, pol.polcmd, 
       pg_get_expr(pol.polqual, pol.polrelid) as using_expr
FROM pg_policy pol 
JOIN pg_class pc ON pol.polrelid = pc.oid
WHERE pc.relname IN ('products', 'purchases', 'categories', 'expenses', 'employees', 'sales', 'sale_items')
ORDER BY pc.relname, pol.polname;
```

**სწორი RLS pattern:**
```sql
-- SELECT: მხოლოდ თავის tenant-ის მონაცემები
USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))

-- INSERT: მხოლოდ თავის tenant_id-ით
WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
```

### 5. antigravity1985geo@gmail.com-ის ფიქსი

ამ მომხმარებელსაც `tenant_id = NULL` აქვს. ან:
- წაშალე ეს profile თუ ტესტ ექაუნთია
- ან შეუქმენი ახალი tenant თუ რეალურია

---

## 🔧 ფაილების სია

| ფაილი | რა უნდა შეიცვალოს |
|---|---|
| `lib/auth.ts` | register() — metadata-ში company_name გადაცემა, client-side fallback |
| `components/login-page.tsx` | არ მოითხოვს ცვლილებას (უკვე აგროვებს companyName/companySlug) |
| **Supabase DB** | `handle_new_auth_user()` trigger function — tenant creation logic |

---

## ⚠️ მნიშვნელოვანი შენიშვნები

1. **SECURITY DEFINER** — ტრიგერი უნდა იყოს SECURITY DEFINER რომ RLS-ის გვერდით ჩაიაროს
2. **Slug უნიკალურობა** — `tenants.slug` უნიკალურია, ამიტომ slug გენერაციაში random suffix აუცილებელია
3. **ON CONFLICT handling** — profile-ის insert-ში ON CONFLICT DO UPDATE უნდა იყოს DO NOTHING-ის ნაცვლად, რომ tenant_id განახლდეს
4. **Multi-tenant isolation** — ყველა data table-ის RLS policy უნდა ფილტრავდეს tenant_id-ით. თუ რომელიმე ტაბულას არ აქვს — ეს დიდი უსაფრთხოების ხვრელია
5. **Realtime subscriptions** — `.on()` ფილტრებშიც tenant_id უნდა იყოს: `filter: \`tenant_id=eq.${tenantId}\``

---

## 🧪 ტესტირების ნაბიჯები

1. გახსენი incognito browser
2. შედი რეგისტრაციის გვერდზე
3. შეავსე ახალი მომხმარებლის მონაცემები (ახალი email, სახელი, კომპანია)
4. რეგისტრაციის შემდეგ:
   - ✅ ადმინ პანელზე TENANT ID უნდა ჩანდეს (არა N/A)
   - ✅ შესყიდვების გვერდი უნდა მუშაობდეს (არა "Missing tenant_id")
   - ✅ პროდუქტების დამატება უნდა მუშაობდეს
   - ✅ სხვა კომპანიის მონაცემები არ უნდა ჩანდეს
5. შეამოწმე old user (j19mt85@gmail.com) — მათი მონაცემები ხელუხლებელი უნდა იყოს
