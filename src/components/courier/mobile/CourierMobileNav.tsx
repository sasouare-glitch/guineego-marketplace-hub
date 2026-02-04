import { Link, useLocation } from "react-router-dom";
import { Home, Package, MapPin, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Accueil", href: "/courier", color: "text-guinea-green" },
  { icon: Package, label: "Missions", href: "/courier/missions", color: "text-guinea-yellow" },
  { icon: MapPin, label: "En cours", href: "/courier/active", color: "text-guinea-red" },
  { icon: Wallet, label: "Argent", href: "/courier/earnings", color: "text-guinea-green" },
  { icon: User, label: "Profil", href: "/courier/profile", color: "text-muted-foreground" },
];

export const CourierMobileNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-border safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-200 min-w-[72px]",
                isActive 
                  ? "bg-primary/10 scale-110" 
                  : "hover:bg-muted active:scale-95"
              )}
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                  isActive 
                    ? "bg-primary shadow-lg" 
                    : "bg-muted"
                )}
              >
                <item.icon 
                  className={cn(
                    "w-7 h-7",
                    isActive ? "text-primary-foreground" : item.color
                  )} 
                  strokeWidth={2.5}
                />
              </div>
              <span 
                className={cn(
                  "text-xs font-bold",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
