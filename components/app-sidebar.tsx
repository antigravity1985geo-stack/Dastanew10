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

const navGroups = [
  {
    label: "მთავარი",
    items: [
      { label: "დეშბორდი", href: "/dashboard", icon: LayoutDashboard },
      { label: "ანალიტიკა", href: "/analytics", icon: TrendingUp, requiresAdmin: true },
      { label: "რეპორტინგი", href: "/reporting", icon: FileText, requiresAdmin: true },
    ]
  },
  {
    label: "ERP / მართვა",
    items: [
      { label: "კლიენტები", href: "/customers", icon: Users, requiresAdmin: true },
      { label: "თანამშრომლები", href: "/employees", icon: Users, requiresAdmin: true },
      { label: "ხელფასები", href: "/payroll", icon: Wallet, requiresAdmin: true },
      { label: "ფილიალები", href: "/branches", icon: Building2, requiresAdmin: true },
      { label: "გადაზიდვა", href: "/transfers", icon: ArrowLeftRight, requiresAdmin: true },
    ]
  },
  {
    label: "ოპერაციები",
    items: [
      { label: "გაყიდვა", href: "/sales", icon: TrendingUp },
      { label: "შესყიდვა", href: "/purchases", icon: ShoppingCart, requiresAdmin: true },
      { label: "ინვენტარი", href: "/inventory", icon: ClipboardCheck, requiresAdmin: true },
      { label: "წარმოება", href: "/production", icon: ChefHat, requiresAdmin: true },
      { label: "ეტიკეტები", href: "/price-tags", icon: Tag, requiresAdmin: true },
    ]
  },
  {
    label: "სისტემა",
    items: [
      { label: "ადმინი", href: "/admin", icon: Shield, requiresAdmin: true },
      { label: "აქციები", href: "/promotions", icon: Tag, requiresAdmin: true },
      { label: "ბუღალტერია", href: "/accounting", icon: BookOpen, requiresAdmin: true },
      { label: "RS.GE", href: "/rsge", icon: Link2, requiresAdmin: true },
      { label: "საწყობი", href: "/mobile-warehouse", icon: QrCode },
      { label: "გზამკვლევი", href: "/guide", icon: BookOpen },
    ]
  }
];

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
    <Sidebar collapsible="icon" className="border-r" style={{ borderColor: 'rgba(255,255,255,0.04)', width: isCollapsed ? undefined : '220px' }}>
      <SidebarHeader className="flex items-center gap-2.5 px-4 py-4 border-none overflow-hidden">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #ffe0a6, #c9a96e)' }}>
          <Warehouse className="h-4 w-4 text-black" />
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-black tracking-tight truncate text-sidebar-foreground">
              {companyName}
            </h1>
            <p className="text-[9px] font-semibold uppercase tracking-widest truncate" style={{ color: 'rgba(255,224,166,0.35)' }}>მართვის სისტემა</p>
          </div>
        )}
      </SidebarHeader>

      {!isCollapsed && store.branches.length > 0 && (
        <div className="px-3 py-1.5">
          <Select
            value={store.currentBranchId || ""}
            onValueChange={(val) => store.setCurrentBranch(val)}
          >
            <SelectTrigger className="w-full h-8 text-[11px] font-bold rounded-lg border-none px-3" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}>
              <SelectValue placeholder="ფილიალი" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-none shadow-2xl" style={{ background: '#1a1a1a' }}>
              {store.branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id} className="text-[11px] font-medium cursor-pointer" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {branch.name} {branch.isMain ? "✦" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <SidebarContent className="px-2 py-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2">
            {!isCollapsed && <div className="larkon-group-label">{group.label}</div>}
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                if (item.requiresAdmin && store.currentEmployee && store.currentEmployee.position !== "ადმინისტრატორი") {
                  return null;
                }

                return (
                  <SidebarMenuItem key={item.href} className="mb-0.5">
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className="h-auto p-0 bg-transparent hover:bg-transparent transition-none"
                    >
                      <Link 
                        href={item.href} 
                        className={cn(
                          "larkon-nav-item",
                          isActive && "is-active",
                          isCollapsed ? "justify-center px-0 h-8 w-8 mx-auto" : "px-3"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-2")} />
                        {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-3 py-3 border-t flex flex-col gap-2" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        {currentUser && !isCollapsed && (
          <div className="flex items-center gap-2 px-1 mb-1">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(255,224,166,0.08)', border: '1px solid rgba(255,224,166,0.12)' }}>
              <User className="h-3.5 w-3.5" style={{ color: '#ffe0a6' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-sidebar-foreground">
                {currentUser.displayName}
              </p>
              <p className="text-[9px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>
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
            "larkon-nav-item h-8 opacity-50 hover:opacity-100 hover:bg-red-500/10 hover:text-red-400",
            isCollapsed ? "justify-center px-0 w-8 h-8 mx-auto" : "w-full px-3 gap-2"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="font-bold text-xs">გამოსვლა</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
