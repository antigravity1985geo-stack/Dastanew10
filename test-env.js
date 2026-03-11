const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDatabase() {
  console.log("Checking RLS policies...");
  // Let's just try inserting an employee without a session to see the exact error
  // or with a valid mock to see if RLS blocks it.
  
  const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com', // user's email? maybe I shouldn't guess emails.
    password: 'password123'
  });

  // Just fetch policies
  // Since we use ANON KEY, we can't query pg_policies easily unless we use service_role.
  // I will just rely on the postgres error code output by making a direct call:
  const { error } = await supabase.from('employees').insert({
    name: 'Test',
    position: 'ადმინისტრატორი',
    phone: '123',
    pin_code: '123',
    tenant_id: '00000000-0000-0000-0000-000000000000'
  });
  console.log("Insert Error:", error);
}

checkDatabase();
