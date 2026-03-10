import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  Store, 
  Truck, 
  TrendingUp, 
  ShoppingBag, 
  Shield, 
  ArrowLeftRight,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ElementType; color: string; path: string }> = {
  customer: { label: 'Client', icon: ShoppingBag, color: 'text-blue-500', path: '/marketplace' },
  ecommerce: { label: 'Vendeur', icon: Store, color: 'text-emerald-500', path: '/seller/dashboard' },
  courier: { label: 'Livreur', icon: Truck, color: 'text-orange-500', path: '/courier/dashboard' },
  closer: { label: 'Closer', icon: TrendingUp, color: 'text-purple-500', path: '/seller/dashboard' },
  investor: { label: 'Investisseur', icon: TrendingUp, color: 'text-amber-500', path: '/investor/dashboard' },
  super_user: { label: 'Super User', icon: Shield, color: 'text-cyan-500', path: '/admin/dashboard' },
  admin: { label: 'Admin', icon: Shield, color: 'text-destructive', path: '/admin/dashboard' },
};

export function RoleSwitcher() {
  const { activeRole, userRoles, switchRole } = useAuth();
  const navigate = useNavigate();

  // Don't show if user has only one role
  if (userRoles.length <= 1) return null;

  const currentConfig = ROLE_CONFIG[activeRole];
  const CurrentIcon = currentConfig.icon;

  const handleSwitch = (role: UserRole) => {
    switchRole(role);
    navigate(ROLE_CONFIG[role].path);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-border/50 hover:border-primary/30"
        >
          <CurrentIcon className={cn("w-4 h-4", currentConfig.color)} />
          <span className="hidden sm:inline text-xs font-medium">{currentConfig.label}</span>
          <ArrowLeftRight className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
          Changer d'espace
        </div>
        {userRoles.map((role) => {
          const config = ROLE_CONFIG[role];
          const Icon = config.icon;
          const isActive = role === activeRole;
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleSwitch(role)}
              className={cn(
                "cursor-pointer gap-3 py-2.5",
                isActive && "bg-primary/5"
              )}
            >
              <Icon className={cn("w-4 h-4", config.color)} />
              <span className="flex-1 font-medium">{config.label}</span>
              {isActive && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
