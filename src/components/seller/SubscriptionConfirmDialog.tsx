import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Smartphone, CreditCard, Loader2 } from 'lucide-react';
import { type SellerPlan } from '@/constants/sellerPlans';

type PaymentMethod = 'orange_money' | 'mtn_money' | 'card';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'orange_money', label: 'Orange Money', icon: <Smartphone className="h-5 w-5" />, color: 'text-orange-500' },
  { id: 'mtn_money', label: 'MTN Money', icon: <Smartphone className="h-5 w-5" />, color: 'text-yellow-500' },
  { id: 'card', label: 'Carte bancaire', icon: <CreditCard className="h-5 w-5" />, color: 'text-primary' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SellerPlan;
  currentPlanName: string;
  onConfirm: (paymentMethod: PaymentMethod, phone?: string) => Promise<void>;
}

export function SubscriptionConfirmDialog({ open, onOpenChange, plan, currentPlanName, onConfirm }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('orange_money');
  const [phone, setPhone] = useState('');
  const [processing, setProcessing] = useState(false);

  const isMobileMoney = method === 'orange_money' || method === 'mtn_money';
  const needsPhone = plan.price > 0 && isMobileMoney;

  const handleConfirm = async () => {
    if (needsPhone && !phone.trim()) return;
    setProcessing(true);
    try {
      await onConfirm(method, needsPhone ? phone.trim() : undefined);
      onOpenChange(false);
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price: number) =>
    price === 0 ? 'Gratuit' : `${price.toLocaleString('fr-GN')} GNF`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Confirmer le changement de plan</DialogTitle>
          <DialogDescription>
            Passage de <strong>{currentPlanName}</strong> → <strong>{plan.name}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Plan summary */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan sélectionné</span>
            <Badge variant="secondary" className="font-semibold">{plan.name}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Montant mensuel</span>
            <span className="text-lg font-bold text-foreground">{formatPrice(plan.price)}/mois</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Limite produits</span>
            <span className="text-sm font-medium text-foreground">
              {plan.productLimit === Infinity ? 'Illimité' : plan.productLimit}
            </span>
          </div>
        </div>

        {/* Payment method */}
        {plan.price > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Mode de paiement</Label>
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              {PAYMENT_METHODS.map((pm) => (
                <Label
                  key={pm.id}
                  htmlFor={pm.id}
                  className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50 has-[&[data-state=checked]]:border-primary has-[&[data-state=checked]]:bg-primary/5"
                >
                  <RadioGroupItem value={pm.id} id={pm.id} />
                  <span className={pm.color}>{pm.icon}</span>
                  <span className="text-sm font-medium text-foreground">{pm.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Phone number for mobile money */}
        {needsPhone && (
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold">
              Numéro {method === 'orange_money' ? 'Orange Money' : 'MTN Money'}
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ex: 620 00 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              {method === 'orange_money'
                ? 'Vous serez redirigé vers la page de paiement Orange Money.'
                : 'Un prompt USSD sera envoyé sur ce numéro pour confirmer le paiement.'}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={processing || (needsPhone && !phone.trim())}>
            {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {plan.price === 0 ? 'Confirmer' : 'Payer & activer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
