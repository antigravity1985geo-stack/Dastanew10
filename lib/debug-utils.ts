import { supabase } from "./lib/supabase";
import { authStore } from "./lib/auth";

async function runDebug() {
  console.log("Checking session...");
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.log("No active session found.");
    return;
  }

  console.log("User ID:", session.user.id);
  console.log("User Email:", session.user.email);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (profileError) {
    console.error("Profile fetch error:", profileError);
  } else {
    console.log("Profile data:", profile);
  }

  if (profile?.tenant_id) {
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", profile.tenant_id)
      .single();
    
    if (tenantError) {
      console.error("Tenant fetch error:", tenantError);
    } else {
      console.log("Tenant data:", tenant);
    }
  } else {
    console.log("No tenant_id in profile.");
  }
}

// Since we are in a browser-like env in Next.js, 
// I'll just expose this on window if I could, but I'll try to run it via a command if I can.
// Actually, I'll just look at the code logic more.
