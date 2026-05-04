import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, ShoppingCart, ChefHat, UtensilsCrossed,
  Package, Users, BarChart3, Truck, Heart, CalendarDays,
  LogOut, PanelLeft, Flame, Upload, Grid3x3, Receipt, AlertCircle, QrCode, Clock, TrendingUp, Zap,
  History, CreditCard, Layers, FlaskConical, Trash2, ClipboardList,
  Briefcase, Mail, MessageSquare, Bell, MapPin, ChevronDown, ChevronRight, HelpCircle, BookOpen,
} from "lucide-react";
import { CSSProperties, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { AiChatAgent } from "./AiChatAgent";

interface MenuItem {
  icon: any;
  label: string;
  path: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: any;
  defaultPath: string;
  items: MenuItem[];
}

export const menuGroups: MenuGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    defaultPath: "/",
    items: [
      { icon: LayoutDashboard, label: "Overview", path: "/" },
      { icon: Bell, label: "Notifications", path: "/notifications" },
    ],
  },
  {
    id: "sales",
    label: "Sales & Orders",
    icon: ShoppingCart,
    defaultPath: "/sales-overview",
    items: [
      { icon: LayoutDashboard, label: "Overview", path: "/sales-overview" },
      { icon: ShoppingCart, label: "POS", path: "/pos" },
      { icon: ChefHat, label: "Kitchen (KDS)", path: "/kds" },
      { icon: History, label: "Order History", path: "/order-history" },
      { icon: LayoutDashboard, label: "Order Queue", path: "/order-queue" },
      { icon: AlertCircle, label: "Void & Refunds", path: "/void-refunds" },
      { icon: ClipboardList, label: "Void Reasons", path: "/void-reasons" },
      { icon: CreditCard, label: "Payments", path: "/payments" },
      { icon: AlertCircle, label: "Disputes", path: "/payment-disputes" },
    ],
  },
  {
    id: "menu",
    label: "Menu & Recipes",
    icon: UtensilsCrossed,
    defaultPath: "/menu",
    items: [
      { icon: UtensilsCrossed, label: "Menu", path: "/menu" },
      { icon: Layers, label: "Combos", path: "/combos" },
      { icon: Clock, label: "Dayparts", path: "/dayparts" },
      { icon: FlaskConical, label: "Recipe Analysis", path: "/recipe-analysis" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory & Supply",
    icon: Package,
    defaultPath: "/inventory",
    items: [
      { icon: Package, label: "Inventory", path: "/inventory" },
      { icon: ShoppingCart, label: "Procurement", path: "/procurement" },
      { icon: Trash2, label: "Waste Tracking", path: "/waste-tracking" },
      { icon: Truck, label: "Suppliers", path: "/suppliers" },
      { icon: BarChart3, label: "Supplier Tracking", path: "/supplier-tracking" },
      { icon: Upload, label: "Price Uploads", path: "/price-uploads" },
    ],
  },
  {
    id: "staff",
    label: "Staff & Operations",
    icon: Users,
    defaultPath: "/labour",
    items: [
      { icon: Briefcase, label: "Labour", path: "/labour" },
      { icon: Users, label: "Staff Directory", path: "/staff" },
    ],
  },
  {
    id: "customers",
    label: "Customers & Marketing",
    icon: Heart,
    defaultPath: "/customers-overview",
    items: [
      { icon: LayoutDashboard, label: "Overview", path: "/customers-overview" },
      { icon: Heart, label: "Customers", path: "/customers" },
      { icon: Zap, label: "Segments", path: "/segments" },
      { icon: MessageSquare, label: "SMS Campaigns", path: "/sms-settings" },
      { icon: Mail, label: "Email Campaigns", path: "/email-campaigns" },
    ],
  },
  {
    id: "reservations",
    label: "Reservations & Seating",
    icon: CalendarDays,
    defaultPath: "/reservations-overview",
    items: [
      { icon: LayoutDashboard, label: "Overview", path: "/reservations-overview" },
      { icon: CalendarDays, label: "Reservations", path: "/reservations" },
      { icon: Clock, label: "Waitlist", path: "/waitlist" },
      { icon: Grid3x3, label: "Floor Plan", path: "/floor-plan" },
      { icon: QrCode, label: "QR Codes", path: "/qr-codes" },
    ],
  },
  {
    id: "reports",
    label: "Reports & Analytics",
    icon: BarChart3,
    defaultPath: "/analytics",
    items: [
      { icon: TrendingUp, label: "Analytics Dashboard", path: "/analytics" },
      { icon: BarChart3, label: "Reports", path: "/reports" },
      { icon: TrendingUp, label: "Profitability", path: "/profitability" },
      { icon: TrendingUp, label: "Sales Forecasting", path: "/sales-forecasting" },
      { icon: Receipt, label: "Z-Reports", path: "/z-reports" },
      { icon: BarChart3, label: "Custom Reports", path: "/custom-reports" },
    ],
  },
  {
    id: "settings",
    label: "Settings & Admin",
    icon: MapPin,
    defaultPath: "/settings",
    items: [
      { icon: LayoutDashboard, label: "System Settings", path: "/settings" },
      { icon: Zap, label: "Integrations", path: "/integrations" },
      { icon: Upload, label: "Data Imports", path: "/data-imports" },
      { icon: MapPin, label: "Locations", path: "/locations" },
      { icon: CreditCard, label: "Location Pricing", path: "/location-pricing" },
    ],
  },
  {
    id: "support",
    label: "Help & Support",
    icon: HelpCircle,
    defaultPath: "/help",
    items: [
      { icon: BookOpen, label: "Help Center", path: "/help" },
      { icon: Zap, label: "Setup Guide", path: "/setup" },
    ],
  },
];

const TopNavBar = () => {
  const [location, setLocation] = useLocation();
  const activeGroup = menuGroups.find(
    g => g.items.some(i => i.path === location) || g.defaultPath === location || (location.startsWith(g.defaultPath) && g.defaultPath !== "/")
  );
  
  if (!activeGroup || activeGroup.items.length <= 1) return null;

  return (
    <div className="flex items-center gap-6 overflow-x-auto border-b border-border/40 px-6 py-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-30 no-scrollbar">
      {activeGroup.items.map(item => {
        const isActive = location === item.path || (location.startsWith(item.path + "/") && item.path !== "/");
        return (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className={`flex items-center gap-2 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap
              ${isActive 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold tracking-tight">RestoFlow</span>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Sign in to access your restaurant management dashboard.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `260px` } as CSSProperties}
    >
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();

  const activeGroup = menuGroups.find(
    g => g.items.some(i => i.path === location) || g.defaultPath === location || (location.startsWith(g.defaultPath) && g.defaultPath !== "/")
  );

  return (
    <>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="h-16 justify-center">
          <div className="flex items-center gap-3 px-2 transition-all w-full">
            <button
              onClick={toggleSidebar}
              className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
              aria-label="Toggle navigation"
            >
              <PanelLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            {!isCollapsed ? (
              <div className="flex items-center gap-2 min-w-0">
                <Flame className="h-5 w-5 text-primary shrink-0" />
                <span className="font-bold tracking-tight truncate text-foreground">RestoFlow</span>
              </div>
            ) : null}
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0 overflow-y-auto">
          <SidebarMenu className="px-2 py-1">
            {menuGroups.map((group) => {
              const isActive = activeGroup?.id === group.id;

              return (
                <SidebarMenuItem key={group.id}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => setLocation(group.defaultPath)}
                    tooltip={group.label}
                    className="h-10 transition-all font-medium mb-1 text-sm group-data-[collapsible=icon]:justify-center"
                  >
                    <group.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                    {!isCollapsed && <span>{group.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-9 w-9 border shrink-0">
                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium truncate leading-none">{user?.name || "-"}</p>
                  <p className="text-xs text-muted-foreground truncate mt-1.5">{user?.email || "-"}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground font-medium">
                {activeGroup?.label ?? "Menu"}
              </span>
            </div>
          </div>
        )}
        
        {/* Inject Top Navigation Bar */}
        <TopNavBar />

        <main className="flex-1 p-4 lg:p-6">
          {children}
          <AiChatAgent />
        </main>
      </SidebarInset>
    </>
  );
}
