import { useState, useEffect, useMemo } from "react";
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
import { useCurrency } from "@/hooks/useCurrency";
import {
  collection, query, where, orderBy, onSnapshot, limit, Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface SellerHeaderProps {
  sidebarCollapsed?: boolean;
  onMenuClick?: () => void;
}

interface NotifItem {
  id: string;
  title: string;
  type: string;
  read: boolean;
  createdAt: Timestamp | null;
}

function timeAgo(ts: any): string {
  if (!ts) return '';
  const now = Date.now();
  const then = ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return `Il y a ${Math.floor(diff / 86400)}j`;
}

export function SellerHeader({ sidebarCollapsed = false, onMenuClick }: SellerHeaderProps) {
  const { user: firebaseUser, profile, signOut, claims } = useAuth();
  const { currentPlan } = useSellerSubscription();
  const { format: formatPrice } = useCurrency();
  const [storeName, setStoreName] = useState<string>("");

  const sellerScopeId = useMemo(
    () => claims?.ecomId || firebaseUser?.uid || null,
    [claims?.ecomId, firebaseUser?.uid]
  );

  // --- Notifications from Firestore ---
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', firebaseUser.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsub = onSnapshot(q,
      (snap) => {
        setNotifications(snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || data.message || 'Notification',
            type: data.type || 'system',
            read: data.read ?? false,
            createdAt: data.createdAt || null,
          };
        }));
      },
      (err) => console.warn('Header notifications error:', err)
    );

    return () => { try { unsub(); } catch {} };
  }, [firebaseUser?.uid]);

  // --- Today's sales & pending orders from Firestore ---
  const [todaySales, setTodaySales] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    if (!sellerScopeId) return;

    const q = query(
      collection(db, 'orders'),
      where('sellerId', '==', sellerScopeId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(q,
      (snap) => {
        const today = new Date().toISOString().slice(0, 10);
        let sales = 0;
        let pending = 0;

        snap.docs.forEach(d => {
          const data = d.data();
          const status = data.status || '';

          // Count pending orders
          if (status === 'pending' || status === 'confirmed' || status === 'preparing') {
            pending++;
          }

          // Sum today's completed sales
          if (data.createdAt) {
            const orderDate = data.createdAt.toDate().toISOString().slice(0, 10);
            if (orderDate === today && status !== 'cancelled') {
              sales += data.totalAmount || data.total || data.pricing?.total || 0;
            }
          }
        });

        setTodaySales(sales);
        setPendingOrders(pending);
      },
      (err) => console.warn('Header orders error:', err)
    );

    return () => { try { unsub(); } catch {} };
  }, [sellerScopeId]);

  // --- Store name ---
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

  const typeBadge: Record<string, { label: string; variant: string }> = {
    order: { label: 'Commande', variant: 'bg-primary text-primary-foreground' },
    stock: { label: 'Stock', variant: 'bg-destructive text-destructive-foreground' },
    payment: { label: 'Paiement', variant: 'bg-primary text-primary-foreground' },
    system: { label: 'Système', variant: 'bg-muted text-muted-foreground' },
  };

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
          {/* Quick Stats — real data */}
          <div className="hidden lg:flex items-center gap-4 mr-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Ventes aujourd'hui</p>
              <p className="text-sm font-semibold text-foreground">{formatPrice(todaySales)}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Commandes</p>
              <p className="text-sm font-semibold text-primary">
                {pendingOrders > 0 ? `${pendingOrders} en attente` : '0 en attente'}
              </p>
            </div>
          </div>

          {/* Help */}
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Notifications — real data */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <DropdownMenuItem disabled className="text-center text-muted-foreground py-4">
                  Aucune notification
                </DropdownMenuItem>
              ) : (
                notifications.slice(0, 4).map((notif) => {
                  const badge = typeBadge[notif.type] || typeBadge.system;
                  return (
                    <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 py-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${badge.variant}`}>
                          {badge.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{timeAgo(notif.createdAt)}</span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm">{notif.title}</p>
                    </DropdownMenuItem>
                  );
                })
              )}
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      {storeName || "Ma boutique"}
                    </span>
                    <SellerPlanBadge badge={currentPlan.badge} />
                  </div>
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
