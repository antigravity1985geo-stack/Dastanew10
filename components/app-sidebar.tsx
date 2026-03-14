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
  ClipboardCheck,
  ChefHat,
  Building2,
  ArrowLeftRight,
  FileText,
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
    label: "ანალიტიკა",
    href: "/analytics",
    icon: TrendingUp,
    requiresAdmin: true,
  },
  {
    label: "კლიენტები",
    href: "/customers",
    icon: Users,
    requiresAdmin: true,
  },
  {
    label: "რეპორტინგი",
    href: "/reporting",
    icon: FileText,
    requiresAdmin: true,
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
    label: "ეტიკეტები",
    href: "/price-tags",
    icon: Tag,
    requiresAdmin: true,
  },
  {
    label: "ინვენტარიზაცია",
    href: "/inventory",
    icon: ClipboardCheck,
    requiresAdmin: true,
  },
  {
    label: "წარმოება",
    href: "/production",
    icon: ChefHat,
    requiresAdmin: true,
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
    label: "თანამშრომლები",
    href: "/employees",
    icon: Users,
    requiresAdmin: true,
  },
  {
    label: "ხელფასები",
    href: "/payroll",
    icon: Wallet,
    requiresAdmin: true,
  },
  {
    label: "ფილიალები",
    href: "/branches",
    icon: Building2,
    requiresAdmin: true,
  },
  {
    label: "შიდა გადაზიდვა",
    href: "/transfers",
    icon: ArrowLeftRight,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

      {!isCollapsed && store.branches.length > 0 && (
        <div className="px-4 py-2 border-b border-sidebar-border">
          <Select
            value={store.currentBranchId || ""}
            onValueChange={(val) => store.setCurrentBranch(val)}
          >
            <SelectTrigger className="w-full h-9 bg-sidebar-accent/50 border-none text-xs font-medium">
              <SelectValue placeholder="აირჩიეთ ფილიალი" />
            </SelectTrigger>
            <SelectContent>
              {store.branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name} {branch.isMain ? "(მთავარი)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            // SECURITY: Completely hide the menu item if an employee logged in and is not an admin.
            // If no employee is logged in, we assume the main account owner and show it.
            if (item.requiresAdmin && store.currentEmployee && store.currentEmployee.position !== "ადმინისტრატორი") {
              return null;
            }

            return (
              <SidebarMenuItem key={item.href} className="mb-2">
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className="h-auto p-0 bg-transparent hover:bg-transparent transition-none"
                >
                  <Link 
                    href={item.href} 
                    className={cn(
                      "uiverse-btn h-11 transition-all",
                      isActive && "is-active",
                      isCollapsed ? "w-11 px-0 justify-center" : "w-full px-4 justify-start"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                    {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
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
                {currentUser.email}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={cn(
            "uiverse-btn transition-all opacity-80 hover:opacity-100",
            isCollapsed ? "w-11 h-11 px-0 justify-center" : "w-full h-11 px-4 justify-start gap-2"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>სისტემიდან გასვლა</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
