import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calculator, 
  Package, 
  History,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/transit/dashboard" },
  { icon: Calculator, label: "Calculer un devis", href: "/transit/quote" },
  { icon: Package, label: "Suivi de colis", href: "/transit/tracking" },
  { icon: History, label: "Mes expéditions", href: "/transit/shipments" },
  { icon: FileText, label: "Mes factures", href: "/transit/invoices" },
];

const bottomItems = [
  { icon: Settings, label: "Paramètres", href: "/transit/settings" },
  { icon: HelpCircle, label: "Aide", href: "/transit/help" },
];

export const TransitSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-3 group">
          <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <div className="w-10 h-10 bg-guinea-red rounded-xl flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-foreground">GuineeGo</h1>
            <p className="text-xs text-muted-foreground">Transit Chine</p>
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
                  ? "bg-guinea-red text-white shadow-lg" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* China Flag Banner */}
      <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-red-600 to-red-500 rounded-xl text-white">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🇨🇳</span>
          <span className="text-2xl">→</span>
          <span className="text-2xl">🇬🇳</span>
        </div>
        <p className="text-sm font-medium">Import direct de Chine</p>
        <p className="text-xs opacity-80">Guangzhou • Yiwu • Shenzhen</p>
      </div>

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
