import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Wallet, 
  PieChart,
  History,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Portfolio", href: "/investor/dashboard" },
  { icon: TrendingUp, label: "Opportunités", href: "/investor/opportunities" },
  { icon: Wallet, label: "Mes placements", href: "/investor/investments" },
  { icon: PieChart, label: "Rendements", href: "/investor/returns" },
  { icon: History, label: "Historique", href: "/investor/history" },
];

const bottomItems = [
  { icon: Settings, label: "Paramètres", href: "/investor/settings" },
  { icon: HelpCircle, label: "Aide", href: "/investor/help" },
];

export const InvestorSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-3 group">
          <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-foreground">GuineeGo</h1>
            <p className="text-xs text-muted-foreground">Investisseur</p>
          </div>
        </Link>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-primary" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Menu */}
      <div className="p-4 border-t border-border space-y-1">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
        <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-3 text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="w-5 h-5" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
};
