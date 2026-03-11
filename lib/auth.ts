"use client";

import { supabase } from "./supabase";

export interface User {
  id: string;
  email: string;
  displayName: string;
  tenantId: string;
  role: string;
  createdAt: string;
}

type AuthListener = () => void;

export interface AuthSnapshot {
  currentUser: User | null;
  isAuthenticated: boolean;
  tenantId: string | null;
}

const TENANT_KEY = "dasta_tenant_id";

class AuthStore {
  private currentUser: User | null = null;
  private tenantId: string | null = null;
  private listeners: Set<AuthListener> = new Set();
  private _cachedSnapshot: AuthSnapshot | null = null;
  private initialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      // Load cached tenant_id immediately for faster startup
      try {
        this.tenantId = localStorage.getItem(TENANT_KEY);
      } catch {}
      this.initialize();
    }
  }

  private async initialize() {
    try {
      // Check existing Supabase Auth session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        await this.loadProfile(session.user.id, session.user.email || "");
      }

      // Listen for auth state changes (login, logout, token refresh)
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await this.loadProfile(session.user.id, session.user.email || "");
        } else if (event === "SIGNED_OUT") {
          this.currentUser = null;
          this.tenantId = null;
          try { localStorage.removeItem(TENANT_KEY); } catch {}
          this.notify();
        }
      });

      this.initialized = true;
      this.notify();
    } catch (err) {
      console.error("Auth init error:", err);
      this.initialized = true;
      this.notify();
    }
  }

  private async loadProfile(userId: string, email: string) {
    let { data: profile, error } = await supabase
      .from("profiles")
      .select("tenant_id, display_name, role")
      .eq("id", userId)
      .maybeSingle(); // maybeSingle instead of single prevents 406 errors

    // Auto-create profile if trigger failed previously
    if (!profile) {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          display_name: email.split("@")[0],
          role: "owner"
        })
        .select("tenant_id, display_name, role")
        .maybeSingle();
      
      profile = newProfile;
    }

    if (profile) {
      this.tenantId = profile.tenant_id;
      try { localStorage.setItem(TENANT_KEY, profile.tenant_id || ""); } catch {}

      this.currentUser = {
        id: userId,
        email,
        displayName: profile.display_name || email,
        tenantId: profile.tenant_id,
        role: profile.role || "owner",
        createdAt: new Date().toISOString(),
      };
    } else {
      // Fallback if we still can't get a profile
      this.currentUser = {
        id: userId,
        email,
        displayName: email.split("@")[0],
        tenantId: "",
        role: "owner",
        createdAt: new Date().toISOString(),
      };
    }
    this.notify();
  }

  private invalidateSnapshot() {
    this._cachedSnapshot = null;
  }

  private notify() {
    this.invalidateSnapshot();
    this.listeners.forEach((l) => l());
  }

  getSnapshot(): AuthSnapshot {
    if (!this._cachedSnapshot) {
      this._cachedSnapshot = {
        currentUser: this.currentUser,
        isAuthenticated: !!this.currentUser,
        tenantId: this.tenantId,
      };
    }
    return this._cachedSnapshot;
  }

  subscribe(listener: AuthListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getTenantId(): string {
    return this.tenantId || localStorage.getItem(TENANT_KEY) || "";
  }

  // ──────────── Authentication Methods ────────────

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Invalid login")) {
          return { success: false, error: "ელ-ფოსტა ან პაროლი არასწორია" };
        }
        return { success: false, error: error.message };
      }
      if (data.user) {
        await this.loadProfile(data.user.id, data.user.email || "");
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "ტექნიკური შეცდომა" };
    }
  }

  async register(
    email: string,
    password: string,
    displayName: string,
    companyName: string,
    companySlug: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          return { success: false, error: "ეს ელ-ფოსტა უკვე რეგისტრირებულია" };
        }
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: "რეგისტრაცია ვერ მოხერხდა" };
      }

      // 2. Auto-generate slug if empty
      let finalSlug = companySlug;
      if (!finalSlug || finalSlug.trim() === "") {
        const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
        const randomStr = Math.random().toString(36).substring(2, 6);
        finalSlug = `${cleanName}-${randomStr}`;
      } else {
        finalSlug = finalSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      }

      // 3. Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: companyName,
          slug: finalSlug,
          owner_id: authData.user.id,
        })
        .select()
        .single();

      if (tenantError) {
        if (tenantError.message.includes("tenants_slug_key")) {
          return { success: false, error: "ეს კომპანიის URL უკვე დაკავებულია" };
        }
        return { success: false, error: "კომპანიის შექმნა ვერ მოხერხდა: " + tenantError.message };
      }

      // 3. Link profile to tenant
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ tenant_id: tenant.id, display_name: displayName, role: "owner" })
        .eq("id", authData.user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
      }

      // 4. Load profile into state
      await this.loadProfile(authData.user.id, email);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "ტექნიკური შეცდომა" };
    }
  }

  async logout() {
    await supabase.auth.signOut();
    this.currentUser = null;
    this.tenantId = null;
    try { localStorage.removeItem(TENANT_KEY); } catch {}
    this.notify();
  }
}

let _authInstance: AuthStore | null = null;
function getAuthStore(): AuthStore {
  if (!_authInstance) {
    _authInstance = new AuthStore();
  }
  return _authInstance;
}

export const authStore =
  typeof window !== "undefined" ? getAuthStore() : new AuthStore();
