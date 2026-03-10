"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AIAssistant } from "@/components/ai-assistant";
import { useHeader } from "@/lib/header-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { title, actions } = useHeader();

  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col h-full overflow-hidden">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 flex items-center justify-between min-w-0">
              <div className="font-black text-sm tracking-tight truncate ml-2 uppercase opacity-80">
                {title}
              </div>
              <div className="flex items-center gap-2">
                {actions}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
        <AIAssistant />
      </div>
    </SidebarProvider>
  );
}
