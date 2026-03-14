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
      <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col h-full overflow-hidden bg-slate-50/50">
          <header className="sticky top-0 z-20 flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-slate-200/60 bg-white/80 backdrop-blur-md px-4 sm:px-8 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <SidebarTrigger className="-ml-1 opacity-60 hover:opacity-100 transition-opacity" />
              <div className="font-bold text-[10px] sm:text-xs tracking-[0.1em] text-slate-500 truncate uppercase">
                {title}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {actions}
              <ModeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto w-full bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 min-h-full p-4 sm:p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {children}
            </div>
          </main>
        </SidebarInset>
        <AIAssistant />
      </div>
    </SidebarProvider>
  );
}
