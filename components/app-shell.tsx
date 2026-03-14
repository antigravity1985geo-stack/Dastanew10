"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AIAssistant } from "@/components/ai-assistant";
import { useHeader } from "@/lib/header-store";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/lib/language-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { title, actions } = useHeader();
  const { t } = useLanguage();

  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] w-full overflow-hidden" style={{ background: 'var(--erp-bg0)' }}>
        <AppSidebar />
        <SidebarInset className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--erp-bg0)' }}>
          {/* Topbar */}
          <header
            className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 px-5"
            style={{
              background: 'var(--erp-bg1)',
              borderBottom: '1px solid var(--erp-border)',
              flexShrink: 0,
            }}
          >
            <SidebarTrigger
              className="-ml-1 transition-opacity"
              style={{ color: 'var(--erp-silver)', opacity: 0.5 }}
            />
            {/* Page title */}
            <div
              className="flex-1 text-sm font-semibold"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                background: 'linear-gradient(135deg, #e8c97a, #c9a84c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {title}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <LanguageSwitcher variant="topbar" />
              <ModeToggle />
            </div>
          </header>

          {/* Content area */}
          <main
            className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-4"
            style={{ background: 'var(--erp-bg0)' }}
          >
            <div className="max-w-[1400px] w-full mx-auto animate-in fade-in duration-300">
              {children}
            </div>
          </main>
        </SidebarInset>
        <AIAssistant />
      </div>
    </SidebarProvider>
  );
}
