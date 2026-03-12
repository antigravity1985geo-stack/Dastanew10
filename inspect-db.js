
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple parser for .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTables() {
  console.log("--- Inspecting 'products' ---");
  const { data: pData, error: pError } = await supabase.from('products').select('*').limit(1);
  if (pError) console.error("Products select error:", pError.message);
  else if (pData && pData.length > 0) console.log("Products columns:", Object.keys(pData[0]));
  else console.log("Products table is empty.");

  console.log("\n--- Inspecting 'profiles' ---");
  const { data: profData, error: profError } = await supabase.from('profiles').select('*').limit(1);
  if (profError) console.error("Profiles select error:", profError.message);
  else if (profData && profData.length > 0) console.log("Profiles columns:", Object.keys(profData[0]));
  else console.log("Profiles table is empty.");
}

inspectTables();
