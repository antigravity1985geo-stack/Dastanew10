const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fkzenrulvbpmmpukeyxx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZremVucnVsdmJwbW1wdWtleXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjU3NTAsImV4cCI6MjA4ODMwMTc1MH0.6PUEK5McHsq_AUqnzorJxnE_rSiKOZf6ckbtGs1S8jM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking enum values and table types...");
  
  // Check user_role enum
  const { data: enumData, error: enumError } = await supabase.rpc('get_enum_values', { enum_name: 'user_role' });
  if (enumError) {
    // If RPC doesn't exist, try raw query via another way or just check profiles/users columns
    console.warn("RPC get_enum_values failed, checking columns instead.");
  } else {
    console.log("Enum values:", enumData);
  }

  // Check columns of profiles and users
  const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*').limit(1);
  const { data: usersData, error: usersError } = await supabase.from('users').select('*').limit(1);

  if (profilesData && profilesData.length > 0) {
    console.log("Profiles columns:", Object.keys(profilesData[0]));
    console.log("Profiles sample role:", profilesData[0].role);
  }
  if (usersData && usersData.length > 0) {
    console.log("Users columns:", Object.keys(usersData[0]));
    console.log("Users sample role:", usersData[0].role);
  }
}

async function checkViaQuery() {
    // Since I can't run arbitrary SQL easily without an API endpoint, 
    // I'll try to select from pg_type if possible (usually blocked for anon)
}

check();
