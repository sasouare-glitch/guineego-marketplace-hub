import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  MapPin, 
  Wallet,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  Bike
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CourierSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/courier/dashboard" },
  { icon: Package, label: "Missions", href: "/courier/missions" },
  { icon: MapPin, label: "En cours", href: "/courier/active" },
  { icon: Wallet, label: "Revenus", href: "/courier/earnings" },
  { icon: BarChart3, label: "Statistiques", href: "/courier/stats" },
];

const bottomMenuItems = [
  { icon: Settings, label: "Paramètres", href: "/courier/settings" },
  { icon: HelpCircle, label: "Aide", href: "/courier/help" },
];

export const CourierSidebar = ({ collapsed, onToggle }: CourierSidebarProps) => {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <Link to="/courier/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Bike className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-display font-bold text-lg">GuineeGo</span>
              <span className="text-xs text-muted-foreground block">Coursier</span>
            </div>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn("hidden lg:flex", collapsed && "rotate-180")}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary-foreground")} />
              {!collapsed && (
                <span className="font-medium truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Menu du bas */}
      <div className="p-2 border-t border-border space-y-1">
        {bottomMenuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
};
