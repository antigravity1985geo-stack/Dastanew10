"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import translations, { Lang } from "@/lib/i18n";

// ── Context ───────────────────────────────────────────────
interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translate a dot-notated key, e.g. t("common.save") */
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "ka",
  setLang: () => {},
  t: (key) => key,
});

const STORAGE_KEY = "dasta-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ka");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null
    ) as Lang | null;
    if (saved && ["ka", "en", "ru", "az"].includes(saved)) {
      setLangState(saved);
    }
    setMounted(true);
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newLang);
    }
    // Update html lang attr
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLang;
    }
  }, []);

  /** Resolve a dot-path like "common.save" against the current locale */
  const t = useCallback(
    (key: string): string => {
      const dict = translations[lang] as any;
      const parts = key.split(".");
      let value: any = dict;
      for (const part of parts) {
        if (value == null || typeof value !== "object") return key;
        value = value[part];
      }
      if (typeof value === "string") return value;
      return key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
