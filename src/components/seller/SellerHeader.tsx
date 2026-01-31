import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface SellerHeaderProps {
  sidebarCollapsed?: boolean;
  onMenuClick?: () => void;
}

export function SellerHeader({ sidebarCollapsed = false, onMenuClick }: SellerHeaderProps) {
  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-background/80 backdrop-blur-lg border-b border-border transition-all duration-300 ${
        sidebarCollapsed ? "left-20" : "left-64"
      }`}
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher produits, commandes..."
              className="w-80 pl-9 bg-muted border-0"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Quick Stats */}
          <div className="hidden lg:flex items-center gap-4 mr-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Ventes aujourd'hui</p>
              <p className="text-sm font-semibold text-foreground">1.250.000 GNF</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Commandes</p>
              <p className="text-sm font-semibold text-primary">5 en attente</p>
            </div>
          </div>

          {/* Help */}
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                    Commande
                  </Badge>
                  <span className="text-xs text-muted-foreground">Il y a 5 min</span>
                </div>
                <p className="text-sm">Nouvelle commande #1234 reçue</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">Stock</Badge>
                  <span className="text-xs text-muted-foreground">Il y a 1h</span>
                </div>
                <p className="text-sm">Stock faible: iPhone 15 Pro Max</p>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/seller/notifications" className="text-center text-primary">
                  Voir toutes les notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <div className="w-8 h-8 bg-primary-gradient rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">AD</span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">Amadou Diallo</p>
                  <p className="text-xs text-muted-foreground">Vendeur Pro</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/seller/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/seller/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Paramètres boutique
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/" className="flex items-center gap-2">
                  Retour au site
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
