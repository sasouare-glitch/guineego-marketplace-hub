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
  Heart,
  Languages,
  Shield,
  LogOut,
  Settings,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useTranslation } from "@/hooks/useTranslation";
import { usePreferences } from "@/hooks/usePreferences";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { t, language } = useTranslation();
  const { setLanguage } = usePreferences();
  const { hasRole, user, profile, signOut } = useAuth();
  const isAdmin = hasRole('admin');
  const isLoggedIn = !!user;

  const languages = [
    { code: "fr" as const, label: "Français", flag: "🇫🇷" },
    { code: "en" as const, label: "English", flag: "🇬🇧" },
    { code: "ar" as const, label: "العربية", flag: "🇸🇦" },
    { code: "zh" as const, label: "中文", flag: "🇨🇳" },
  ];

  const navigation = [
    { 
      name: t.nav.buy, 
      href: "/marketplace",
      icon: ShoppingCart,
      submenu: [
        { name: t.header.allProducts, href: "/marketplace" },
        { name: t.header.search, href: "/search" },
      ]
    },
    { 
      name: t.nav.sell, 
      href: "/seller/dashboard",
      icon: Store,
      submenu: [
        { name: t.header.sellerSpace, href: "/seller/dashboard" },
        { name: t.header.myProducts, href: "/seller/products" },
        { name: t.header.ordersMenu, href: "/seller/orders" },
        { name: t.header.finances, href: "/seller/finances" },
      ]
    },
    { 
      name: t.nav.transit, 
      href: "/transit/dashboard",
      icon: Globe,
      submenu: [
        { name: t.header.dashboard, href: "/transit/dashboard" },
        { name: t.header.calculateQuote, href: "/transit/quote" },
        { name: t.header.trackPackage, href: "/transit/tracking" },
        { name: t.header.myShipments, href: "/transit/shipments" },
      ]
    },
    { 
      name: t.nav.delivery, 
      href: "/courier/dashboard",
      icon: Truck,
      submenu: [
        { name: t.header.courierSpace, href: "/courier/dashboard" },
        { name: t.header.missions, href: "/courier/missions" },
        { name: t.header.myEarnings, href: "/courier/earnings" },
      ]
    },
    { 
      name: t.nav.academy, 
      href: "/academy",
      icon: GraduationCap,
      submenu: [
        { name: t.header.allCourses, href: "/academy" },
        { name: t.header.freeCourses, href: "/academy?free=true" },
      ]
    },
    { 
      name: t.nav.invest, 
      href: "/investor/dashboard",
      icon: BarChart3,
      submenu: [
        { name: t.header.myPortfolio, href: "/investor/dashboard" },
        { name: t.header.opportunities, href: "/investor/opportunities" },
        { name: t.header.myInvestments, href: "/investor/investments" },
      ]
    },
  ];

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
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-lg hover:bg-primary/5">
                  <Languages className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">
                    {languages.find(l => l.code === language)?.flag}
                  </span>
                  <ChevronDown className="w-3 h-3 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`cursor-pointer ${language === lang.code ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin Dashboard Link */}
            {isAdmin && (
              <Link 
                to="/admin/dashboard" 
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors rounded-lg hover:bg-primary/10"
                title="Dashboard Admin"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden md:inline">Admin</span>
              </Link>
            )}

            <Link 
              to="/orders" 
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden md:inline">{t.nav.orders}</span>
            </Link>

            {/* Notifications */}
            <NotificationCenter />

            {/* Wishlist */}
            <Link to="/wishlist" className="relative p-2 text-foreground/70 hover:text-guinea-red transition-colors" title={t.nav.wishlist}>
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
            
            {/* Profile Menu or Login/Register */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-primary/5 transition-colors">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.photoURL || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {profile?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="font-medium text-foreground truncate">
                      {profile?.displayName || 'Utilisateur'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Mon profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/orders" className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Mes commandes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/wishlist" className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Ma wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/settings/preferences" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/admin/dashboard" className="flex items-center gap-2 text-primary">
                          <Shield className="w-4 h-4" />
                          Dashboard Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => signOut()}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">{t.nav.login}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">{t.nav.register}</Link>
                </Button>
              </div>
            )}

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
                  {t.nav.orders}
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="w-5 h-5" />
                    Dashboard Admin
                  </Link>
                )}
                {isLoggedIn ? (
                  <div className="pt-4 px-4 space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile?.photoURL || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {profile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {profile?.displayName || 'Utilisateur'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      Mon profil
                    </Link>
                    <Link
                      to="/settings/preferences"
                      className="flex items-center gap-3 px-4 py-3 text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="w-5 h-5" />
                      Paramètres
                    </Link>
                    <Button 
                      variant="outline" 
                      className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 px-4 flex gap-2">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link to="/login">{t.nav.login}</Link>
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link to="/register">{t.nav.register}</Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}