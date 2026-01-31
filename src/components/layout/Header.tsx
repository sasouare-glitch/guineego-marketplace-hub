import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, 
  X, 
  ShoppingCart, 
  User, 
  ChevronDown,
  Package,
  Truck,
  GraduationCap,
  Store,
  Globe,
  BarChart3,
  ClipboardList,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

const navigation = [
  { 
    name: "Acheter", 
    href: "/marketplace",
    icon: ShoppingCart,
    submenu: [
      { name: "Tous les produits", href: "/marketplace" },
      { name: "Rechercher", href: "/search" },
    ]
  },
  { 
    name: "Vendre", 
    href: "/seller/dashboard",
    icon: Store,
    submenu: [
      { name: "Espace vendeur", href: "/seller/dashboard" },
      { name: "Mes produits", href: "/seller/products" },
      { name: "Commandes", href: "/seller/orders" },
      { name: "Finances", href: "/seller/finances" },
    ]
  },
  { 
    name: "Transit Chine", 
    href: "/transit/dashboard",
    icon: Globe,
    submenu: [
      { name: "Tableau de bord", href: "/transit/dashboard" },
      { name: "Calculer un devis", href: "/transit/quote" },
      { name: "Suivi de colis", href: "/transit/tracking" },
      { name: "Mes expéditions", href: "/transit/shipments" },
    ]
  },
  { 
    name: "Livraison", 
    href: "/courier/dashboard",
    icon: Truck,
    submenu: [
      { name: "Espace coursier", href: "/courier/dashboard" },
      { name: "Missions", href: "/courier/missions" },
      { name: "Mes revenus", href: "/courier/earnings" },
    ]
  },
  { 
    name: "Academy", 
    href: "/academy",
    icon: GraduationCap,
    submenu: [
      { name: "Toutes les formations", href: "/academy" },
      { name: "Formations gratuites", href: "/academy?free=true" },
    ]
  },
  { 
    name: "Investir", 
    href: "/investor/dashboard",
    icon: BarChart3,
    submenu: [
      { name: "Mon portfolio", href: "/investor/dashboard" },
      { name: "Opportunités", href: "/investor/opportunities" },
      { name: "Mes placements", href: "/investor/investments" },
    ]
  },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <nav className="container-tight">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-gradient rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              GuineeGo<span className="text-primary"> LAT</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <div 
                key={item.name}
                className="relative"
                onMouseEnter={() => item.submenu && setActiveSubmenu(item.name)}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <Link
                  to={item.href}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                  {item.submenu && <ChevronDown className="w-3 h-3" />}
                </Link>

                {/* Submenu */}
                <AnimatePresence>
                  {item.submenu && activeSubmenu === item.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-1 w-48 bg-card rounded-xl shadow-lg border border-border overflow-hidden"
                    >
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className="block px-4 py-3 text-sm text-foreground/80 hover:bg-primary/5 hover:text-primary transition-colors"
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link 
              to="/orders" 
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden md:inline">Mes commandes</span>
            </Link>

            {/* Notifications */}
            <NotificationCenter />

            {/* Wishlist */}
            <Link to="/wishlist" className="relative p-2 text-foreground/70 hover:text-guinea-red transition-colors" title="Mes favoris">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-guinea-red text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>
            
            <Link to="/cart" className="relative p-2 text-foreground/70 hover:text-primary transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-guinea-red text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
            
            {/* Profile Link */}
            <Link 
              to="/profile" 
              className="p-2 text-foreground/70 hover:text-primary transition-colors rounded-full hover:bg-primary/5"
              title="Mon profil"
            >
              <User className="w-5 h-5" />
            </Link>
            
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Connexion</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">S'inscrire</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 text-foreground/70 hover:text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden border-t border-border"
            >
              <div className="py-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
                <Link
                  to="/orders"
                  className="flex items-center gap-3 px-4 py-3 text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ClipboardList className="w-5 h-5" />
                  Mes commandes
                </Link>
                <div className="pt-4 px-4 flex gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link to="/login">Connexion</Link>
                  </Button>
                  <Button className="flex-1" asChild>
                    <Link to="/register">S'inscrire</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
