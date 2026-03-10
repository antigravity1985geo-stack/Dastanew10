"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printPage } from "@/lib/print";

interface PageHeaderProps {
  title: string;
  description?: string;
  printTitle?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  printTitle,
  children,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-row flex-wrap items-start justify-between gap-2 sm:gap-4 pb-4 sm:pb-6">
      <div className="flex-1 min-w-[200px]">
        <h1 className="text-2xl font-black tracking-tight text-foreground text-balance">
          {title}
        </h1>
        {description && (
          <p className="text-[11px] font-bold text-muted-foreground/70 mt-1 uppercase tracking-widest leading-none">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2 w-full sm:w-auto mt-1 sm:mt-0">
        {children}
        {actions}
        <Button
          variant="outline"
          size="sm"
          onClick={() => printPage(printTitle || title)}
          className="gap-2 shrink-0 border-border/50 bg-white/50 hover:bg-white text-slate-700 font-bold"
        >
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">ბეჭდვა</span>
        </Button>
      </div>
    </div>
  );
}
