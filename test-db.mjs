import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDatabase() {
  const { data, error } = await supabase.from('employees').insert({
    name: 'Test',
    position: 'ადმინისტრატორი',
    phone: '123',
    pin_code: '123',
    tenant_id: '00000000-0000-0000-0000-000000000000'
  });
  console.log("Error details:", JSON.stringify(error, null, 2));
}

checkDatabase();
