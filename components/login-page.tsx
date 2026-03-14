"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";

export function LoginPage() {
  const { login, register } = useAuth();
  const { t } = useLanguage();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Register-only fields
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || t("auth.loginError"));
      }
    } catch (err) {
      setError(t("auth.technicalError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t("auth.passwordMin"));
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(email, password, displayName, companyName, companySlug);
      if (!result.success) {
        setError(result.error || t("auth.registerError"));
      }
    } catch (err) {
      setError(t("auth.technicalError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="uiverse-v2-wrapper min-h-screen" style={{ position: "relative" }}>
      {/* Language switcher — top right */}
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 100 }}>
        <LanguageSwitcher variant="login" />
      </div>

      <form
        onSubmit={isRegisterMode ? handleRegister : handleLogin}
        className="uiverse-v2-form w-[350px] sm:w-[450px]"
      >
        <div style={{ textAlign: "center" }}>
          <span className="uiverse-v2-title">
            {t("auth.loginTitle")}
          </span>
          <div style={{
            fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--erp-silver)", opacity: 0.5, marginTop: 4,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {t("auth.loginSubtitle")}
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full">
          {isRegisterMode && (
            <>
              <div className="uiverse-v2-input-container">
                <input
                  type="text"
                  className="uiverse-v2-input font-sans"
                  placeholder={t("auth.displayName")}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
              <div className="uiverse-v2-input-container">
                <input
                  type="text"
                  className="uiverse-v2-input font-sans"
                  placeholder={t("auth.companyName")}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="uiverse-v2-input-container">
                <input
                  type="text"
                  className="uiverse-v2-input font-sans"
                  placeholder={t("auth.companySlug")}
                  value={companySlug}
                  onChange={(e) =>
                    setCompanySlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                    )
                  }
                />
              </div>
            </>
          )}

          <div className="uiverse-v2-input-container">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="ml-2"
            >
              <defs>
                <linearGradient id="gradient-stroke" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="black" />
                  <stop offset="100%" stopColor="white" />
                </linearGradient>
              </defs>
              <g stroke="url(#gradient-stroke)" fill="none" strokeWidth="1">
                <path d="M21.6365 5H3L12.2275 12.3636L21.6365 5Z" />
                <path d="M16.5 11.5L22.5 6.5V17L16.5 11.5Z" />
                <path d="M8 11.5L2 6.5V17L8 11.5Z" />
                <path d="M9.5 12.5L2.81805 18.5002H21.6362L15 12.5L12 15L9.5 12.5Z" />
              </g>
            </svg>
            <input
              type="email"
              className="uiverse-v2-input"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="uiverse-v2-input-container">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="ml-2"
            >
              <g stroke="url(#gradient-stroke)" fill="none" strokeWidth="1">
                <path d="M3.5 15.5503L9.20029 9.85L12.3503 13L11.6 13.7503H10.25L9.8 15.1003L8 16.0003L7.55 18.2503L5.5 19.6003H3.5V15.5503Z" />
                <path d="M16 3.5H11L8.5 6L16 13.5L21 8.5L16 3.5Z" />
                <path d="M16 10.5L18 8.5L15 5.5H13L12 6.5L16 10.5Z" />
              </g>
            </svg>
            <input
              type="password"
              className="uiverse-v2-input"
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegisterMode ? "new-password" : "current-password"}
              required
            />
          </div>
        </div>

        {error && (
          <div className="mt-2 text-[10px] text-red-400 font-bold uppercase tracking-wider text-center bg-red-500/10 px-4 py-1 rounded-full border border-red-500/20">
            {error}
          </div>
        )}

        <div className="uiverse-v2-login-button">
          <button type="submit" disabled={isLoading}>
            {isLoading
              ? t("common.loading").toUpperCase()
              : isRegisterMode
              ? t("auth.registerButton").toUpperCase()
              : t("auth.loginButton").toUpperCase()}
          </button>
        </div>

        <div className="flex justify-between w-full mt-4 text-[10px] uppercase font-black tracking-widest text-[#444] hover:text-[#ffe0a6] transition-colors cursor-pointer group">
          <span onClick={() => setIsRegisterMode(!isRegisterMode)}>
            {isRegisterMode ? t("auth.switchToLogin") : t("auth.switchToRegister")}
          </span>
        </div>

        <div className="uiverse-v2-texture" />
      </form>
    </div>
  );
}
