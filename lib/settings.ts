// Settings Store - localStorage based

export interface Settings {
  companyName: string;
  currency: string;
  language: string;
  phone?: string;
  email?: string;
  bankAccount?: string;
  address?: string;
  // RS.GE Settings
  rsgeUsername?: string;
  rsgePassword?: string;
  rsgeAutoSend?: boolean;
  // Fiscal Settings
  fiscalType?: "none" | "digital" | "physical";
  fiscalAutoPrint?: boolean;
  deletePin?: string;
}

type SettingsListener = () => void;

const SETTINGS_KEY = "warehouse_settings";

const DEFAULT_SETTINGS: Settings = {
  companyName: "DASTA CLOUD JR",
  currency: "₾",
  language: "ქართული",
  phone: "",
  email: "",
  bankAccount: "",
  address: "",
  rsgeUsername: "",
  rsgePassword: "",
  rsgeAutoSend: false,
  fiscalType: "none",
  fiscalAutoPrint: false,
  deletePin: "1234",
};

class SettingsStore {
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private listeners: Set<SettingsListener> = new Set();
  private _cachedSnapshot: Settings | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
      } catch {
        // ignore
      }
    }
  }

  private invalidateSnapshot() {
    this._cachedSnapshot = null;
  }

  private notify() {
    this.invalidateSnapshot();
    this.listeners.forEach((l) => l());
  }

  private persist() {
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

  updateSettings(updates: Partial<Settings>) {
    this.settings = { ...this.settings, ...updates };
    this.persist();
    this.notify();
  }

  getSettings(): Settings {
    return { ...this.settings };
  }

  importSettings(settings: Settings) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.persist();
    this.notify();
  }
}

let _settingsInstance: SettingsStore | null = null;
function getSettingsStore(): SettingsStore {
  if (!_settingsInstance) {
    _settingsInstance = new SettingsStore();
  }
  return _settingsInstance;
}

export const settingsStore =
  typeof window !== "undefined" ? getSettingsStore() : new SettingsStore();
