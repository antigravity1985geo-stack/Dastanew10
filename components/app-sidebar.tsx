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
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { useWarehouseStore } from "@/hooks/use-store";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const navGroups = [
  {
    label: "General",
    items: [
      { label: "დეშბორდი", href: "/dashboard", icon: LayoutDashboard },
      { label: "ანალიტიკა", href: "/analytics", icon: TrendingUp, requiresAdmin: true },
      { label: "რეპორტინგი", href: "/reporting", icon: FileText, requiresAdmin: true },
    ]
  },
  {
    label: "Finance",
    items: [
      { label: "კლიენტები", href: "/customers", icon: Users, requiresAdmin: true },
      { label: "ხელფასები", href: "/payroll", icon: Wallet, requiresAdmin: true },
      { label: "ბუღალტერია", href: "/accounting", icon: BookOpen, requiresAdmin: true },
      { label: "RS.GE", href: "/rsge", icon: Link2, requiresAdmin: true },
    ]
  },
  {
    label: "Operations",
    items: [
      { label: "გაყიდვა", href: "/sales", icon: TrendingUp },
      { label: "შესყიდვა", href: "/purchases", icon: ShoppingCart, requiresAdmin: true },
      { label: "ინვენტარი", href: "/inventory", icon: ClipboardCheck, requiresAdmin: true },
      { label: "წარმოება", href: "/production", icon: ChefHat, requiresAdmin: true },
      { label: "ეტიკეტები", href: "/price-tags", icon: Tag, requiresAdmin: true },
      { label: "საწყობი", href: "/mobile-warehouse", icon: QrCode },
    ]
  },
  {
    label: "System",
    items: [
      { label: "თანამშრომლები", href: "/employees", icon: Users, requiresAdmin: true },
      { label: "ფილიალები", href: "/branches", icon: Building2, requiresAdmin: true },
      { label: "გადაზიდვა", href: "/transfers", icon: ArrowLeftRight, requiresAdmin: true },
      { label: "აქციები", href: "/promotions", icon: Tag, requiresAdmin: true },
      { label: "ადმინი", href: "/admin", icon: Shield, requiresAdmin: true },
      { label: "გზამკვლევი", href: "/guide", icon: BookOpen },
    ]
  }
];

export function AppSidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const store = useWarehouseStore();
  const { companyName } = useSettings();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      style={{
        background: 'var(--erp-bg1)',
        borderRight: '1px solid var(--erp-border)',
        width: isCollapsed ? undefined : '220px',
      }}
    >
      {/* Brand — .brand */}
      <SidebarHeader
        className="flex items-center gap-2.5 overflow-hidden"
        style={{
          padding: '18px 18px 18px',
          borderBottom: '1px solid var(--erp-border)',
        }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            background: 'linear-gradient(135deg, var(--erp-accent), #5040cc)',
            flexShrink: 0,
          }}
        >
          D
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <div
              className="text-[13px] font-semibold truncate"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                background: 'linear-gradient(135deg, #e8c97a, #c9a84c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {companyName}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--erp-silver)' }}>
              ERP Suite
            </div>
          </div>
        )}
      </SidebarHeader>

      {/* Tenant badge */}
      {!isCollapsed && store.branches.length > 0 && (
        <div style={{ padding: '14px 18px 8px' }}>
          <Select
            value={store.currentBranchId || ""}
            onValueChange={(val) => store.setCurrentBranch(val)}
          >
            <SelectTrigger
              className="w-full h-9 text-[11px] font-medium border-none"
              style={{
                background: 'var(--erp-bg3)',
                border: '1px solid var(--erp-border2)',
                borderRadius: '8px',
                color: 'transparent',
                padding: '0 10px',
              }}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--erp-green)' }}
                />
                <SelectValue placeholder="ფილიალი">
                  {store.branches.find(b => b.id === store.currentBranchId)?.name || "ფილიალი"}
                </SelectValue>
              </span>
            </SelectTrigger>
            <SelectContent
              className="rounded-lg border-none shadow-2xl"
              style={{ background: '#1e2233' }}
            >
              {store.branches.map((branch) => (
                <SelectItem
                  key={branch.id}
                  value={branch.id}
                  className="text-[11px] cursor-pointer"
                  style={{ color: 'var(--erp-silver2)' }}
                >
                  {branch.name} {branch.isMain ? "✦" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Nav */}
      <SidebarContent style={{ padding: '4px 10px 8px' }}>
        {navGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: '4px' }}>
            {!isCollapsed && (
              <div className="larkon-group-label">{group.label}</div>
            )}
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                if (
                  item.requiresAdmin &&
                  store.currentEmployee &&
                  store.currentEmployee.position !== "ადმინისტრატორი"
                ) {
                  return null;
                }

                return (
                  <SidebarMenuItem key={item.href} style={{ marginBottom: '1px' }}>
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
                          isCollapsed ? "justify-center px-0 h-8 w-8 mx-auto" : ""
                        )}
                      >
                        <item.icon
                          className="shrink-0"
                          style={{ width: 16, height: 16, opacity: 0.7, flexShrink: 0 }}
                        />
                        {!isCollapsed && (
                          <span className="flex-1 truncate nav-label-text">{item.label}</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>

      {/* Footer — .sidebar-bottom */}
      <SidebarFooter
        className="flex flex-col gap-2"
        style={{
          marginTop: 'auto',
          padding: '0 10px',
          borderTop: '1px solid var(--erp-border)',
          paddingTop: '14px',
          paddingBottom: '12px',
        }}
      >
        {currentUser && !isCollapsed && (
          <div
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer"
            style={{ transition: 'background 150ms' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--erp-bg3)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            {/* Avatar */}
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, var(--erp-accent), #5040cc)' }}
            >
              {(currentUser.displayName || currentUser.email || "U").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[11px] font-medium truncate"
                style={{
                  background: 'linear-gradient(135deg, #d4b86a, #a8b4c0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {currentUser.displayName || currentUser.email}
              </div>
              <div className="text-[9px] opacity-60" style={{ color: 'var(--erp-silver)' }}>
                Admin
              </div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            "larkon-nav-item hover:!text-red-400",
            isCollapsed ? "justify-center px-0 w-8 h-8 mx-auto" : "w-full gap-2"
          )}
          style={{ opacity: 0.55 }}
        >
          <LogOut style={{ width: 16, height: 16 }} />
          {!isCollapsed && <span className="text-xs font-medium">გამოსვლა</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
