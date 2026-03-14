import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Menu,
  Store,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDocument } from "@/lib/firebase/queries";
import { useSellerSubscription } from "@/hooks/useSellerSubscription";
import { SellerPlanBadge } from "@/components/seller/SellerPlanBadge";
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
  const { user: firebaseUser, profile, signOut } = useAuth();
  const [storeName, setStoreName] = useState<string>("");

  useEffect(() => {
    if (!firebaseUser) return;
    fetchDocument<{ id: string; storeInfo?: { name?: string } }>("seller_settings", firebaseUser.uid)
      .then((data) => {
        if (data?.storeInfo?.name) setStoreName(data.storeInfo.name);
      })
      .catch(() => {});
  }, [firebaseUser]);

  const displayName = profile?.profile
    ? `${profile.profile.firstName} ${profile.profile.lastName}`.trim()
    : firebaseUser?.displayName || 'Vendeur';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">{initials}</span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    {storeName || "Vendeur Pro"}
                  </p>
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
              <DropdownMenuItem className="text-destructive flex items-center gap-2" onClick={() => signOut()}>
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
