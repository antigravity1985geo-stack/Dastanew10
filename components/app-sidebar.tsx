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
      { label: "შიდა გადაზიდვა", href: "/transfers", icon: ArrowLeftRight, requiresAdmin: true },
    ]
  },
  {
    label: "მაღაზია / ოპერაციები",
    items: [
      { label: "გაყიდვა", href: "/sales", icon: TrendingUp },
      { label: "შესყიდვა", href: "/purchases", icon: ShoppingCart, requiresAdmin: true },
      { label: "ინვენტარიზაცია", href: "/inventory", icon: ClipboardCheck, requiresAdmin: true },
      { label: "წარმოება", href: "/production", icon: ChefHat, requiresAdmin: true },
      { label: "ეტიკეტები", href: "/price-tags", icon: Tag, requiresAdmin: true },
    ]
  },
  {
    label: "სისტემა",
    items: [
      { label: "ადმინ პანელი", href: "/admin", icon: Shield, requiresAdmin: true },
      { label: "აქციები", href: "/promotions", icon: Tag, requiresAdmin: true },
      { label: "ბუღალტერია", href: "/accounting", icon: BookOpen, requiresAdmin: true },
      { label: "RS.GE", href: "/rsge", icon: Link2, requiresAdmin: true },
      { label: "მობილური საწყობი", href: "/mobile-warehouse", icon: QrCode },
      { label: "გზამკვლევი", href: "/guide", icon: BookOpen },
    ]
  }
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
      <SidebarHeader className="flex items-center gap-3 px-6 py-6 border-none overflow-hidden">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
          <Warehouse className="h-6 w-6 text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black tracking-tight truncate text-sidebar-foreground">
              {companyName}
            </h1>
            <p className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest truncate">მართვის სისტემა</p>
          </div>
        )}
      </SidebarHeader>

      {!isCollapsed && store.branches.length > 0 && (
        <div className="px-6 py-2">
          <Select
            value={store.currentBranchId || ""}
            onValueChange={(val) => store.setCurrentBranch(val)}
          >
            <SelectTrigger className="w-full h-10 bg-white/5 border-none text-xs font-bold rounded-xl hover:bg-white/10 transition-all px-4">
              <SelectValue placeholder="აირჩიეთ ფილიალი" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl bg-slate-900 text-white">
              {store.branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id} className="text-xs font-medium focus:bg-white/10 focus:text-white cursor-pointer">
                  {branch.name} {branch.isMain ? "(მთავარი)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <SidebarContent className="px-2 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
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
                  <SidebarMenuItem key={item.href} className="mb-1">
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
                          isCollapsed ? "justify-center px-0 h-10 w-10 mx-auto" : "px-4"
                        )}
                      >
                        <item.icon className={cn("h-[18px] w-[18px]", !isCollapsed && "mr-3")} />
                        {!isCollapsed && <span className="flex-1 opacity-90">{item.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-4 py-6 border-t border-white/5 flex flex-col gap-4">
        {currentUser && !isCollapsed && (
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
              <User className="h-5 w-5 text-sidebar-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-sidebar-foreground">
                {currentUser.displayName}
              </p>
              <p className="text-[10px] font-medium truncate text-sidebar-foreground/40 lowercase">
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
            "larkon-nav-item h-11 opacity-60 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive",
            isCollapsed ? "justify-center px-0 w-10 h-10 mx-auto" : "w-full px-4 gap-3"
          )}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!isCollapsed && <span className="font-bold">გამოსვლა</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
