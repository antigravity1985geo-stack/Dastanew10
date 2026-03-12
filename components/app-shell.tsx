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
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-md px-6">
            <div className="flex items-center gap-4 min-w-0">
              <SidebarTrigger className="-ml-1" />
              <div className="font-black text-sm tracking-tight truncate uppercase opacity-80">
                {title}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {actions}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-[1600px] mx-auto w-full">
              {children}
            </div>
          </main>
        </SidebarInset>
        <AIAssistant />
      </div>
    </SidebarProvider>
  );
}
