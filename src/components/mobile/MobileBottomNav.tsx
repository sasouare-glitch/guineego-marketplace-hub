/**
 * Mobile Bottom Navigation
 * Role-based bottom navigation for mobile devices
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Search, 
  ShoppingCart, 
  ClipboardList, 
  User,
  LayoutDashboard,
  Package,
  Wallet,
  MapPin,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Truck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/auth';

interface NavItem {
  path: string;
  icon: typeof Home;
  label: string;
}

// Navigation items by role
const navByRole: Record<UserRole, NavItem[]> = {
  customer: [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/marketplace', icon: Search, label: 'Explorer' },
    { path: '/cart', icon: ShoppingCart, label: 'Panier' },
    { path: '/my-orders', icon: ClipboardList, label: 'Commandes' },
    { path: '/profile', icon: User, label: 'Profil' }
  ],
  ecommerce: [
    { path: '/seller', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/seller/products', icon: Package, label: 'Produits' },
    { path: '/seller/orders', icon: ClipboardList, label: 'Commandes' },
    { path: '/seller/finances', icon: Wallet, label: 'Finances' },
    { path: '/profile', icon: User, label: 'Profil' }
  ],
  courier: [
    { path: '/courier', icon: LayoutDashboard, label: 'Missions' },
    { path: '/courier/map', icon: MapPin, label: 'Carte' },
    { path: '/courier/earnings', icon: Wallet, label: 'Revenus' },
    { path: '/profile', icon: User, label: 'Profil' }
  ],
  closer: [
    { path: '/closer', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/closer/leads', icon: ClipboardList, label: 'Leads' },
    { path: '/closer/stats', icon: TrendingUp, label: 'Stats' },
    { path: '/profile', icon: User, label: 'Profil' }
  ],
  investor: [
    { path: '/investor', icon: LayoutDashboard, label: 'Portfolio' },
    { path: '/investor/opportunities', icon: Briefcase, label: 'Opportunités' },
    { path: '/investor/investments', icon: TrendingUp, label: 'Invest.' },
    { path: '/profile', icon: User, label: 'Profil' }
  ],
  super_user: [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: User, label: 'Utilisateurs' },
    { path: '/admin/orders', icon: ClipboardList, label: 'Commandes' },
    { path: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
    { path: '/profile', icon: User, label: 'Profil' }
  ],
  admin: [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: User, label: 'Utilisateurs' },
    { path: '/admin/orders', icon: ClipboardList, label: 'Commandes' },
    { path: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
    { path: '/profile', icon: User, label: 'Profil' }
  ]
};

// Additional quick access items
const quickAccessByRole: Partial<Record<UserRole, NavItem[]>> = {
  customer: [
    { path: '/academy', icon: GraduationCap, label: 'Academy' },
    { path: '/transit', icon: Truck, label: 'Transit' }
  ]
};

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, claims } = useAuth();
  const { items, itemCount } = useCart();

  // Don't show on certain pages
  const hiddenPaths = ['/login', '/register', '/checkout', '/install'];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  const role: UserRole = claims?.role || 'customer';
  const navItems = navByRole[role];
  const cartCount = itemCount;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          const showBadge = item.icon === ShoppingCart && cartCount > 0;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative",
                "transition-colors duration-200",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                
                {/* Cart badge */}
                {showBadge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </div>
              
              <span className="text-[10px] mt-1 font-medium">
                {item.label}
              </span>

              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Floating Action Button for quick actions
 */
export function MobileFAB() {
  const navigate = useNavigate();
  const { claims } = useAuth();
  const role: UserRole = claims?.role || 'customer';

  const fabConfig: Record<UserRole, { icon: typeof Home; path: string; label: string } | null> = {
    customer: null,
    ecommerce: { icon: Package, path: '/seller/products/new', label: 'Nouveau produit' },
    courier: { icon: MapPin, path: '/courier/scan', label: 'Scanner colis' },
    closer: null,
    investor: null,
    super_user: null,
    admin: null
  };

  const config = fabConfig[role];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => navigate(config.path)}
      className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center md:hidden"
      aria-label={config.label}
    >
      <Icon className="w-6 h-6" />
    </motion.button>
  );
}
