"use client";

import { Printer } from "lucide-react";
import { printPage } from "@/lib/print";
import { useLanguage } from "@/lib/language-context";

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
  const { t } = useLanguage();

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-5"
      style={{ borderBottom: '1px solid var(--erp-border)' }}
    >
      {!hideTitle && (
        <div className="flex-1 min-w-0">
          <h1
            className="text-xl sm:text-2xl font-black tracking-tight truncate"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              background: 'linear-gradient(135deg, #e8c97a, #c9a84c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              className="text-[10px] font-semibold mt-0.5 uppercase tracking-widest"
              style={{ color: 'var(--erp-silver)', opacity: 0.5 }}
            >
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
            className="erp-btn flex items-center gap-2 h-8 px-3 text-[10px]"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("common.print")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
