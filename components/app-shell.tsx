"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AIAssistant } from "@/components/ai-assistant";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col h-full overflow-hidden">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
        <AIAssistant />
      </div>
    </SidebarProvider>
  );
}
