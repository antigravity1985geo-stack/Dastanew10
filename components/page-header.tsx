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
    <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground text-balance">
          {title}
        </h1>
        {description && (
          <p className="text-[11px] font-bold text-muted-foreground/70 mt-1 uppercase tracking-widest leading-none">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {children}
        {actions}
        <Button
          variant="outline"
          size="sm"
          onClick={() => printPage(printTitle || title)}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          ბეჭდვა
        </Button>
      </div>
    </div>
  );
}
