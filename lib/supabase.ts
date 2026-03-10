import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log("Supabase Connection Check:", {
    urlDefined: !!supabaseUrl,
    keyDefined: !!supabaseAnonKey,
    urlMatches: supabaseUrl?.includes("fkzenrulvbpmmpukeyxx")
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
