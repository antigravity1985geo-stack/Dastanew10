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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {!hideTitle && (
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {title}
          </h1>
          {description && (
            <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-widest" style={{ color: 'rgba(255,224,166,0.4)' }}>
              {description}
            </p>
          )}
        </div>
      )}
      {!hideActions && (
        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto">
          {children}
          {actions}
          <button
            onClick={() => printPage(printTitle || title)}
            className="premium-btn flex items-center gap-2 h-8 px-3 text-[10px]"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ბეჭდვა</span>
          </button>
        </div>
      )}
    </div>
  );
}
