"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  BookOpen,
  Warehouse,
  Shield,
  LogOut,
  User,
  Users,
  Link2,
  Tag,
  Wallet,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { useWarehouseStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  {
    label: "დეშბორდი",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "შესყიდვა",
    href: "/purchases",
    icon: ShoppingCart,
    requiresAdmin: true,
  },
  {
    label: "გაყიდვა",
    href: "/sales",
    icon: TrendingUp,
  },
  {
    label: "აქციები",
    href: "/promotions",
    icon: Tag,
    requiresAdmin: true,
  },
  {
    label: "ბუღალტერია",
    href: "/accounting",
    icon: BookOpen,
    requiresAdmin: true,
  },
  {
    label: "ხარჯები",
    href: "/expenses",
    icon: Wallet,
    requiresAdmin: true,
  },
  {
    label: "თანამშრომლები",
    href: "/employees",
    icon: Users,
    requiresAdmin: true,
  },
  {
    label: "ადმინ პანელი",
    href: "/admin",
    icon: Shield,
    requiresAdmin: true,
  },
  {
    label: "გზამკვლევი",
    href: "/guide",
    icon: BookOpen,
  },
  {
    label: "RS.GE",
    href: "/rsge",
    icon: Link2,
    requiresAdmin: true,
  },
  {
    label: "მობილური საწყობი",
    href: "/mobile-warehouse",
    icon: QrCode,
  },
];

import { ModeToggle } from "@/components/mode-toggle";

export function AppSidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const store = useWarehouseStore();
  const { companyName } = useSettings();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border overflow-hidden">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
          <Warehouse className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold tracking-tight truncate">
              {companyName}
            </h1>
            <p className="text-xs text-sidebar-foreground/60 truncate">მართვის სისტემა</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            // SECURITY: Completely hide the menu item if it requires admin and the current user is not an admin.
            if (item.requiresAdmin && store.currentEmployee?.position !== "ადმინისტრატორი") {
              return null;
            }

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    "w-full gap-3",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Link href={item.href} className="flex-1 flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-2 py-4 border-t border-sidebar-border flex flex-col gap-3">
        {currentUser && !isCollapsed && (
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
              <User className="h-4 w-4 text-sidebar-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">
                {currentUser.displayName}
              </p>
              <p className="text-xs truncate text-sidebar-foreground/50">
                {currentUser.username}
              </p>
            </div>
          </div>
        )}
        {store.currentEmployee && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => store.logoutEmployee()}
            className={cn(
              "w-full justify-start gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 font-bold",
              isCollapsed && "px-2"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>მოლარის გასვლა</span>}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={cn(
            "w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
            isCollapsed && "px-2"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>სისტემიდან გასვლა</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
