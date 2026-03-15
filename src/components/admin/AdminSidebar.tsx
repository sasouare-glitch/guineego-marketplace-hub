/**
 * ADMIN SIDEBAR: Navigation for admin dashboard
 */

import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Package, 
  Settings,
  BarChart3,
  Truck,
  Wallet,
  FileText,
  Shield,
  ShieldCheck,
  Bell,
  HelpCircle,
  Store,
  GraduationCap,
  Globe,
  Mail,
  UserPlus,
  MessageSquare,
  Percent,
  CreditCard,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const mainNavItems = [
  { 
    title: "Dashboard", 
    url: "/admin/dashboard", 
    icon: LayoutDashboard,
    description: "Vue d'ensemble"
  },
  { 
    title: "Analytiques", 
    url: "/admin/analytics", 
    icon: BarChart3,
    description: "Rapports et KPIs"
  },
];

const managementItems = [
  { 
    title: "Utilisateurs", 
    url: "/admin/users", 
    icon: Users,
    badge: null,
    description: "Gestion des comptes"
  },
  { 
    title: "Super Users", 
    url: "/admin/super-users", 
    icon: ShieldCheck,
    badge: null,
    description: "Gestion des super utilisateurs"
  },
  { 
    title: "Demandes de rôle", 
    url: "/admin/role-requests", 
    icon: UserPlus,
    badge: null,
    description: "Approbation des rôles"
  },
  { 
    title: "Commandes", 
    url: "/admin/orders", 
    icon: ShoppingCart,
    badge: "12",
    description: "Suivi des commandes"
  },
  { 
    title: "Produits", 
    url: "/admin/products", 
    icon: Package,
    description: "Catalogue produits"
  },
  { 
    title: "Vendeurs", 
    url: "/admin/sellers", 
    icon: Store,
    description: "E-commerçants"
  },
];

const operationsItems = [
  { 
    title: "Livraisons", 
    url: "/admin/deliveries", 
    icon: Truck,
    badge: "5",
    description: "Missions en cours"
  },
  { 
    title: "Transit", 
    url: "/admin/transit", 
    icon: Globe,
    description: "Expéditions Chine-Guinée"
  },
  { 
    title: "Academy", 
    url: "/admin/academy", 
    icon: GraduationCap,
    description: "Formations"
  },
];

const financeItems = [
  { 
    title: "Finances", 
    url: "/admin/finances", 
    icon: Wallet,
    description: "Revenus et paiements"
  },
  { 
    title: "Paiements", 
    url: "/admin/payments", 
    icon: CreditCard,
    description: "Suivi des paiements en temps réel"
  },
  { 
    title: "Commissions", 
    url: "/admin/commissions", 
    icon: Percent,
    description: "Taux par catégorie"
  },
  { 
    title: "Rapports", 
    url: "/admin/reports", 
    icon: FileText,
    description: "Exports comptables"
  },
];

const settingsItems = [
  { 
    title: "Paramètres", 
    url: "/admin/settings", 
    icon: Settings,
    description: "Configuration système"
  },
  { 
    title: "Notifications", 
    url: "/admin/notifications", 
    icon: Bell,
    description: "Alertes et messages"
  },
  { 
    title: "Emails", 
    url: "/admin/emails", 
    icon: Mail,
    description: "Suivi des emails envoyés"
  },
  { 
    title: "Sécurité", 
    url: "/admin/security", 
    icon: Shield,
    description: "Accès et permissions"
  },
  {
    title: "SMS Orange",
    url: "/admin/sms-config",
    icon: MessageSquare,
    description: "Configuration API SMS"
  },
  {
    title: "Historique SMS",
    url: "/admin/sms-logs",
    icon: MessageSquare,
    description: "Journal des SMS envoyés"
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');

  const renderNavItem = (item: typeof mainNavItems[0] & { badge?: string | null }) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
        <NavLink 
          to={item.url} 
          end={item.url === "/admin/dashboard"}
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted/50"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <item.icon className="w-5 h-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {item.badge}
                </Badge>
              )}
            </>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar 
      className={collapsed ? "w-16" : "w-64"}
      collapsible="icon"
    >
      {/* Header */}
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-foreground">Admin</h2>
              <p className="text-xs text-muted-foreground">GuineeGo LAT</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Gestion
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operations */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Opérations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finance */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Finance
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Système
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={collapsed ? "Aide" : undefined}>
              <a 
                href="https://docs.lovable.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                {!collapsed && <span>Documentation</span>}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
