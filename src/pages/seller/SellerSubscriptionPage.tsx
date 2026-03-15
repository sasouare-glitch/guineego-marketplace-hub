import { useState } from 'react';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSellerSubscription } from '@/hooks/useSellerSubscription';
import { SELLER_PLANS, type SellerPlanId, type SellerPlan } from '@/constants/sellerPlans';
import { SellerPlanBadge } from '@/components/seller/SellerPlanBadge';
import { SubscriptionConfirmDialog } from '@/components/seller/SubscriptionConfirmDialog';
import { SubscriptionHistory } from '@/components/seller/SubscriptionHistory';
import { Check, Crown, Zap, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const planIcons: Record<SellerPlanId, React.ReactNode> = {
  free: <Package className="h-8 w-8 text-muted-foreground" />,
  pro: <Zap className="h-8 w-8 text-primary" />,
  business: <Crown className="h-8 w-8 text-accent" />,
};

export default function SellerSubscriptionPage() {
  const { planId, currentPlan, loading, upgradePlan } = useSellerSubscription();
  const [selectedPlan, setSelectedPlan] = useState<SellerPlan | null>(null);

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratuit';
    return `${price.toLocaleString('fr-GN')} GNF`;
  };

  return (
    <SellerLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">Abonnement</h1>
          <p className="text-muted-foreground mt-1">
            Choisissez le plan qui correspond à la taille de votre activité
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SELLER_PLANS.map((plan) => {
            const isCurrent = plan.id === planId;
            const isUpgrade = SELLER_PLANS.findIndex(p => p.id === plan.id) > SELLER_PLANS.findIndex(p => p.id === planId);

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative flex flex-col transition-all',
                  plan.recommended && 'border-primary shadow-lg scale-[1.02]',
                  isCurrent && 'ring-2 ring-primary'
                )}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-md">
                      Recommandé
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-3">{planIcons[plan.id]}</div>
                  <CardTitle className="text-xl font-display">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">
                    <span className="text-3xl font-bold text-foreground">
                      {formatPrice(plan.price)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground text-sm"> /mois</span>
                    )}
                  </CardDescription>
                  {plan.badge !== 'none' && (
                    <div className="mt-3">
                      <SellerPlanBadge badge={plan.badge} label={plan.badgeLabel} />
                    </div>
                  )}
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCurrent ? 'outline' : plan.recommended ? 'default' : 'secondary'}
                    disabled={isCurrent || loading}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    {isCurrent ? 'Plan actuel' : isUpgrade ? 'Passer à ce plan' : 'Rétrograder'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Current plan info */}
        <Card className="mt-8">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Votre plan actuel</p>
              <p className="text-lg font-semibold text-foreground">
                {SELLER_PLANS.find(p => p.id === planId)?.name || 'Gratuit'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Limite de produits</p>
              <p className="text-lg font-semibold text-foreground">
                {SELLER_PLANS.find(p => p.id === planId)?.productLimit === Infinity
                  ? 'Illimité'
                  : SELLER_PLANS.find(p => p.id === planId)?.productLimit}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment history */}
        <SubscriptionHistory />
        {selectedPlan && (
          <SubscriptionConfirmDialog
            open={!!selectedPlan}
            onOpenChange={(open) => !open && setSelectedPlan(null)}
            plan={selectedPlan}
            currentPlanName={currentPlan.name}
            onConfirm={async () => {
              await upgradePlan(selectedPlan.id);
            }}
          />
        )}
      </div>
    </SellerLayout>
  );
}
