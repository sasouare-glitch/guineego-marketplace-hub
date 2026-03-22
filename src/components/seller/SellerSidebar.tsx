import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Wallet,
  Settings,
  BarChart3,
  Users,
  MessageSquare,
  Bell,
  ChevronLeft,
  Store,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Tableau de bord", href: "/seller/dashboard", icon: LayoutDashboard },
  { name: "Produits", href: "/seller/products", icon: Package },
  { name: "Commandes", href: "/seller/orders", icon: ShoppingBag },
  { name: "Finances", href: "/seller/finances", icon: Wallet },
  { name: "Statistiques", href: "/seller/analytics", icon: BarChart3 },
  { name: "Clients", href: "/seller/customers", icon: Users },
  { name: "Messages", href: "/seller/messages", icon: MessageSquare },
];

const secondaryNav = [
  { name: "Abonnement", href: "/seller/subscription", icon: Crown },
  { name: "Notifications", href: "/seller/notifications", icon: Bell },
  { name: "Paramètres", href: "/seller/settings", icon: Settings },
];

interface SellerSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

export function SellerSidebar({ collapsed = false, onToggle, onNavigate }: SellerSidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-gradient rounded-xl flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              <span className="font-display text-sm font-bold text-foreground">
                Espace Vendeur
              </span>
              <span className="text-xs text-muted-foreground">GuineeGo LAT</span>
            </motion.div>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggle}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col h-[calc(100vh-4rem)] py-4">
        <div className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0")} />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {item.name}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Secondary Nav */}
        <div className="border-t border-border pt-4 mt-4 px-3 space-y-1">
          {secondaryNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Shop Info */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-3 mt-4 p-4 bg-muted rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-gradient rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-accent-foreground">MB</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  Ma Boutique
                </p>
                <p className="text-xs text-muted-foreground">Premium</p>
              </div>
            </div>
          </motion.div>
        )}
      </nav>
    </aside>
  );
}
