
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
  console.log("Inspecting 'products' table...");
  const { data: row, error: rowError } = await supabase.from('products').select('*').limit(1);
  if (rowError) {
    console.error("Error fetching row:", rowError.message);
  } else if (row && row.length > 0) {
    console.log("Columns found in 'products':", Object.keys(row[0]));
  } else {
    console.log("No rows in 'products' to inspect keys. Trying an insert and rollback or just listing common tables.");
  }
}

inspectTable();
