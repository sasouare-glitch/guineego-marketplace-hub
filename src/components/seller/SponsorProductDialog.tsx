/**
 * Dialog for sellers to sponsor a product
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SPONSOR_PLANS, type SponsorDuration } from '@/constants/sponsorPlans';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';
import { Megaphone, Check, TrendingUp, Eye, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SponsorProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: { id: string; name: string; isSponsored?: boolean; sponsoredUntil?: any } | null;
}

export function SponsorProductDialog({ open, onOpenChange, product }: SponsorProductDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<SponsorDuration>('14d');
  const [saving, setSaving] = useState(false);

  if (!product) return null;

  const isCurrentlySponsored = product.isSponsored && product.sponsoredUntil &&
    (product.sponsoredUntil instanceof Timestamp
      ? product.sponsoredUntil.toDate() > new Date()
      : new Date(product.sponsoredUntil) > new Date());

  const handleSponsor = async () => {
    setSaving(true);
    try {
      const plan = SPONSOR_PLANS.find((p) => p.id === selectedPlan)!;
      const now = new Date();
      const until = new Date(now.getTime() + plan.days * 24 * 60 * 60 * 1000);

      await updateDoc(doc(db, 'products', product.id), {
        isSponsored: true,
        sponsoredAt: serverTimestamp(),
        sponsoredUntil: Timestamp.fromDate(until),
        sponsorPlan: selectedPlan,
        updatedAt: serverTimestamp(),
      });

      toast.success(`"${product.name}" sponsorisé pour ${plan.label}`);
      onOpenChange(false);
    } catch (err) {
      console.error('Error sponsoring product:', err);
      toast.error('Erreur lors de la sponsorisation');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSponsor = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'products', product.id), {
        isSponsored: false,
        sponsoredAt: null,
        sponsoredUntil: null,
        sponsorPlan: null,
        updatedAt: serverTimestamp(),
      });
      toast.success('Sponsorisation retirée');
      onOpenChange(false);
    } catch (err) {
      console.error('Error removing sponsor:', err);
      toast.error('Erreur lors du retrait');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => price.toLocaleString('fr-GN') + ' GNF';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-accent" />
            Sponsoriser un produit
          </DialogTitle>
          <DialogDescription>
            Mettez en avant « {product.name} » dans les résultats de recherche
          </DialogDescription>
        </DialogHeader>

        {isCurrentlySponsored ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 text-center">
              <Badge className="bg-accent text-accent-foreground mb-2">
                <Megaphone className="h-3 w-3 mr-1" />
                Actuellement sponsorisé
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Expire le {product.sponsoredUntil instanceof Timestamp
                  ? product.sponsoredUntil.toDate().toLocaleDateString('fr-FR')
                  : new Date(product.sponsoredUntil).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
              <Button variant="destructive" onClick={handleRemoveSponsor} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Retirer la sponsorisation
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Benefits */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Eye, label: 'Visibilité +300%', color: 'text-primary' },
                { icon: TrendingUp, label: 'Top des résultats', color: 'text-accent' },
                { icon: Zap, label: 'Badge sponsorisé', color: 'text-destructive' },
              ].map((b, i) => (
                <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
                  <b.icon className={cn('h-5 w-5 mx-auto mb-1', b.color)} />
                  <p className="text-xs font-medium text-foreground">{b.label}</p>
                </div>
              ))}
            </div>

            {/* Plan Selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Choisir une durée</p>
              {SPONSOR_PLANS.map((plan) => (
                <Card
                  key={plan.id}
                  className={cn(
                    'cursor-pointer transition-all',
                    selectedPlan === plan.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-muted-foreground/30'
                  )}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                        selectedPlan === plan.id ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                      )}>
                        {selectedPlan === plan.id && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{plan.label}</p>
                        {plan.id === '14d' && (
                          <Badge variant="secondary" className="text-[10px] mt-0.5">Populaire</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-foreground">{formatPrice(plan.price)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSponsor} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                Sponsoriser · {formatPrice(SPONSOR_PLANS.find(p => p.id === selectedPlan)!.price)}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
