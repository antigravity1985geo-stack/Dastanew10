"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AIAssistant } from "@/components/ai-assistant";
import { useHeader } from "@/lib/header-store";
import { ModeToggle } from "@/components/mode-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { title, actions } = useHeader();

  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] w-full overflow-hidden" style={{ background: '#0a0a0a' }}>
        <AppSidebar />
        <SidebarInset className="flex flex-col h-full overflow-hidden" style={{ background: '#0d0d0d' }}>
          <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b px-4 sm:px-6" style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger className="-ml-1 text-white/30 hover:text-white/60 transition-colors" />
              <div className="font-bold text-[10px] tracking-[0.12em] uppercase" style={{ color: 'rgba(255,224,166,0.5)' }}>
                {title}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <ModeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5">
            <div className="max-w-[1400px] mx-auto w-full premium-glass-card min-h-full p-4 sm:p-5 lg:p-8 animate-in fade-in slide-in-from-bottom-1 duration-400">
              {children}
            </div>
          </main>
        </SidebarInset>
        <AIAssistant />
      </div>
    </SidebarProvider>
  );
}
