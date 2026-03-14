import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Shield, Star } from 'lucide-react';

interface SellerPlanBadgeProps {
  badge: 'none' | 'pro' | 'business';
  label?: string;
  className?: string;
}

export function SellerPlanBadge({ badge, label, className }: SellerPlanBadgeProps) {
  if (badge === 'none') return null;

  return (
    <Badge
      className={cn(
        'gap-1 text-xs font-semibold',
        badge === 'pro' && 'bg-primary text-primary-foreground',
        badge === 'business' && 'bg-accent text-accent-foreground',
        className
      )}
    >
      {badge === 'pro' ? <Shield className="h-3 w-3" /> : <Star className="h-3 w-3" />}
      {label || (badge === 'pro' ? 'Vendeur Pro ✓' : 'Business ★')}
    </Badge>
  );
}
