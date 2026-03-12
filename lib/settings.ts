// Settings Store - Supabase-synced with localStorage fallback

import { supabase } from "./supabase";
import { authStore } from "./auth";
import { hashPin } from "./utils";

export interface Settings {
  companyName: string;
  currency: "GEL" | "USD" | "EUR";
  accountingMethod: "accrual" | "cash";
  language: string;
  phone?: string;
  email?: string;
  bankAccount?: string;
  address?: string;
  // RS.GE Settings
  rsgeUsername?: string;
  rsgePassword?: string;
  rsgeTin?: string;
  rsgeAutoSend?: boolean;
  rsgeAutoInvoice?: boolean;
  rsgeDefaultWaybillType?: 1 | 2 | 3;
  rsgeRequireRecipientTin?: boolean;
  // Fiscal Settings
  fiscalType?: "none" | "digital" | "physical";
  fiscalAutoPrint?: boolean;
  closedUntil?: string;
  deletePin?: string;
}

type SettingsListener = () => void;

const SETTINGS_KEY = "warehouse_settings";
const SUPABASE_SETTINGS_KEY = "app_settings"; // Row key in settings table

const DEFAULT_SETTINGS: Settings = {
  companyName: "DASTA CLOUD JR",
  currency: "GEL",
  accountingMethod: "accrual",
  language: "ქართული",
  phone: "",
  email: "",
  bankAccount: "",
  address: "",
  rsgeUsername: "",
  rsgePassword: "",
  rsgeTin: "",
  rsgeAutoSend: false,
  rsgeAutoInvoice: false,
  rsgeDefaultWaybillType: 1,
  rsgeRequireRecipientTin: false,
  fiscalType: "none",
  fiscalAutoPrint: false,
};

class SettingsStore {
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private listeners: Set<SettingsListener> = new Set();
  private _cachedSnapshot: Settings | null = null;
  private syncedFromSupabase = false;

  constructor() {
    if (typeof window !== "undefined") {
      // 1. Load from localStorage first (instant, offline-ready)
      try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
      } catch {
        // ignore
      }

      // 2. Then sync from Supabase (async, latest source of truth)
      this.loadFromSupabase();
    }
  }

  private async loadFromSupabase() {
    try {
      const tenantId = authStore.getTenantId();
      const settingsKey = tenantId ? `${SUPABASE_SETTINGS_KEY}_${tenantId}` : SUPABASE_SETTINGS_KEY;
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', settingsKey)
        .maybeSingle();

      if (error) {
        console.warn("Settings: Supabase fetch failed (table might not exist):", error.message);
        return;
      }

      if (data?.value) {
        this.settings = { ...DEFAULT_SETTINGS, ...data.value };
        this.persistLocal();
        this.syncedFromSupabase = true;
        this.notify();
      }
    } catch (err) {
      console.warn("Settings: Supabase sync failed:", err);
    }
  }

  private async saveToSupabase() {
    try {
      const tenantId = authStore.getTenantId();
      const settingsKey = tenantId ? `${SUPABASE_SETTINGS_KEY}_${tenantId}` : SUPABASE_SETTINGS_KEY;
      const { error } = await supabase
        .from('settings')
        .upsert(
          { key: settingsKey, value: this.settings, updated_at: new Date().toISOString(), tenant_id: tenantId || undefined },
          { onConflict: 'key' }
        );

      if (error) {
        console.warn("Settings: Supabase save failed:", error.message);
      }
    } catch (err) {
      console.warn("Settings: Supabase save error:", err);
    }
  }

  private invalidateSnapshot() {
    this._cachedSnapshot = null;
  }

  private notify() {
    this.invalidateSnapshot();
    this.listeners.forEach((l) => l());
  }

  private persistLocal() {
    if (typeof window !== "undefined") {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    }
  }

  getSnapshot(): Settings {
    if (!this._cachedSnapshot) {
      this._cachedSnapshot = { ...this.settings };
    }
    return this._cachedSnapshot;
  }

  subscribe(listener: SettingsListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async updateSettings(updates: Partial<Settings>) {
    // If updating deletePin, hash it first
    if (updates.deletePin) {
      updates.deletePin = await hashPin(updates.deletePin);
    }
    
    this.settings = { ...this.settings, ...updates };
    this.persistLocal();
    this.saveToSupabase();
    this.notify();
  }

  getSettings(): Settings {
    return { ...this.settings };
  }

  importSettings(settings: Settings) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.persistLocal();
    this.saveToSupabase();
    this.notify();
  }
}

// Singleton - lazy init to avoid SSR issues
// initialize() logic relies on window check internally or can run safely on server cache
let _settingsInstance: SettingsStore | null = null;
function getSettingsStore(): SettingsStore {
  if (!_settingsInstance) {
    _settingsInstance = new SettingsStore();
  }
  return _settingsInstance;
}

export const settingsStore = getSettingsStore();
