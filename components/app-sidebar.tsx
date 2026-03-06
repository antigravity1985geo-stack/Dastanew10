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
  Lock,
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
    href: "/",
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
    label: "ბუღალტერია",
    href: "/accounting",
    icon: BookOpen,
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
];

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
                    {item.requiresAdmin && store.currentEmployee?.position !== "ადმინისტრატორი" && (
                      <Lock className="h-3 w-3 opacity-40 ml-auto" />
                    )}
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
          {!isCollapsed && <span>გასვლა</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
