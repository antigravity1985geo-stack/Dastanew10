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
  hideActions?: boolean;
  hideTitle?: boolean;
}

export function PageHeader({
  title,
  description,
  printTitle,
  children,
  actions,
  hideActions = false,
  hideTitle = false,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-border/10 mb-6">
      {!hideTitle && (
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground truncate">
            {title}
          </h1>
          {description && (
            <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-widest leading-none">
              {description}
            </p>
          )}
        </div>
      )}
      {!hideActions && (
        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto">
          {children}
          {actions}
          <Button
            variant="outline"
            size="sm"
            onClick={() => printPage(printTitle || title)}
            className="gap-2 shrink-0 border-border/50 bg-white/50 hover:bg-white text-slate-700 font-bold h-9 sm:h-10 rounded-xl"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">ბეჭდვა</span>
          </Button>
        </div>
      )}
    </div>
  );
}
