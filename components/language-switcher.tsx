"use client";

import { useLanguage } from "@/lib/language-context";
import { LANGUAGES, Lang } from "@/lib/i18n";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  /** "topbar" = compact, "login" = slightly larger */
  variant?: "topbar" | "login";
}

export function LanguageSwitcher({ variant = "topbar" }: Props) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isLogin = variant === "login";

  return (
    <div ref={ref} style={{ position: "relative", zIndex: 50 }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: isLogin ? "5px 10px" : "4px 9px",
          background: "var(--erp-bg3)",
          border: "1px solid var(--erp-border)",
          borderRadius: 8,
          cursor: "pointer",
          transition: "border-color 150ms",
          color: "var(--erp-silver2)",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.borderColor = "var(--erp-border2)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.borderColor = "var(--erp-border)")
        }
      >
        <span style={{ fontSize: isLogin ? 14 : 13 }}>{current.flag}</span>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.05em",
            background: "linear-gradient(135deg, #e8c97a, #c9a84c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {current.label}
        </span>
        <span
          style={{
            fontSize: 9,
            color: "var(--erp-silver)",
            opacity: 0.5,
            marginLeft: 1,
          }}
        >
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            background: "var(--erp-bg2)",
            border: "1px solid var(--erp-border2)",
            borderRadius: 10,
            padding: "4px",
            minWidth: 140,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {LANGUAGES.map((l) => {
            const isActive = l.code === lang;
            return (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  borderRadius: 7,
                  border: "none",
                  background: isActive
                    ? "linear-gradient(90deg, rgba(124,111,255,0.15), rgba(124,111,255,0.06))"
                    : "transparent",
                  cursor: "pointer",
                  transition: "background 120ms",
                  width: "100%",
                  textAlign: "left",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--erp-bg3)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      left: 4,
                      width: 2.5,
                      height: 16,
                      background: "var(--erp-accent)",
                      borderRadius: "0 2px 2px 0",
                    }}
                  />
                )}
                <span style={{ fontSize: 14 }}>{l.flag}</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "var(--erp-accent2)" : "var(--erp-silver2)",
                    }}
                  >
                    {l.nativeName}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "var(--erp-silver)",
                      opacity: 0.45,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    {l.label}
                  </div>
                </div>
                {isActive && (
                  <span style={{ fontSize: 10, color: "var(--erp-accent)" }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
