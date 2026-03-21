import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Smartphone, CreditCard, Loader2, FlaskConical, CheckCircle2, Shield } from 'lucide-react';
import { type SellerPlan } from '@/constants/sellerPlans';
import { motion, AnimatePresence } from 'framer-motion';

type PaymentMethod = 'orange_money' | 'mtn_money' | 'card' | 'sandbox';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'orange_money', label: 'Orange Money', icon: <Smartphone className="h-5 w-5" />, color: 'text-orange-500' },
  { id: 'mtn_money', label: 'MTN Money', icon: <Smartphone className="h-5 w-5" />, color: 'text-yellow-500' },
  { id: 'card', label: 'Carte bancaire', icon: <CreditCard className="h-5 w-5" />, color: 'text-primary' },
  { id: 'sandbox', label: 'Sandbox (Test)', icon: <FlaskConical className="h-5 w-5" />, color: 'text-guinea-yellow' },
];

type SandboxStep = 'idle' | 'initiating' | 'processing' | 'confirming' | 'success';

const SANDBOX_STEPS: { status: SandboxStep; label: string; delay: number; progress: number }[] = [
  { status: 'initiating', label: 'Connexion API sandbox...', delay: 800, progress: 20 },
  { status: 'processing', label: 'Traitement du paiement...', delay: 1200, progress: 55 },
  { status: 'confirming', label: 'Validation en cours...', delay: 1000, progress: 80 },
  { status: 'success', label: 'Paiement simulé confirmé !', delay: 800, progress: 100 },
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
  const [sandboxStep, setSandboxStep] = useState<SandboxStep>('idle');
  const [sandboxProgress, setSandboxProgress] = useState(0);

  const isMobileMoney = method === 'orange_money' || method === 'mtn_money';
  const isSandbox = method === 'sandbox';
  const needsPhone = plan.price > 0 && isMobileMoney;

  const simulateSandboxPayment = async () => {
    for (const step of SANDBOX_STEPS) {
      await new Promise((r) => setTimeout(r, step.delay));
      setSandboxStep(step.status);
      setSandboxProgress(step.progress);
    }
  };

  const handleConfirm = async () => {
    if (needsPhone && !phone.trim()) return;
    setProcessing(true);
    try {
      if (isSandbox) {
        await simulateSandboxPayment();
        // Small delay to show success before closing
        await new Promise((r) => setTimeout(r, 1000));
      }
      await onConfirm(method, needsPhone ? phone.trim() : undefined);
      onOpenChange(false);
    } finally {
      setProcessing(false);
      setSandboxStep('idle');
      setSandboxProgress(0);
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
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50 has-[&[data-state=checked]]:border-primary has-[&[data-state=checked]]:bg-primary/5 ${
                    pm.id === 'sandbox' ? 'border-dashed border-guinea-yellow/50' : ''
                  }`}
                >
                  <RadioGroupItem value={pm.id} id={pm.id} />
                  <span className={pm.color}>{pm.icon}</span>
                  <span className="text-sm font-medium text-foreground">{pm.label}</span>
                  {pm.id === 'sandbox' && (
                    <Badge variant="outline" className="ml-auto bg-guinea-yellow/10 text-guinea-yellow border-guinea-yellow/30 text-[10px] font-mono">
                      🧪 TEST
                    </Badge>
                  )}
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

        {/* Sandbox info */}
        {isSandbox && plan.price > 0 && sandboxStep === 'idle' && (
          <div className="rounded-lg border-2 border-dashed border-guinea-yellow/40 bg-guinea-yellow/5 p-3 space-y-1">
            <p className="text-sm font-medium text-guinea-yellow flex items-center gap-2">
              <FlaskConical className="h-4 w-4" /> Mode Sandbox
            </p>
            <p className="text-xs text-muted-foreground">
              Aucune transaction réelle ne sera effectuée. Le plan sera activé en mode test pour vérifier le fonctionnement.
            </p>
          </div>
        )}

        {/* Sandbox simulation progress */}
        {isSandbox && sandboxStep !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border-2 border-dashed border-guinea-yellow/50 bg-guinea-yellow/5 p-4 space-y-3"
          >
            <Badge variant="outline" className="bg-guinea-yellow/10 text-guinea-yellow border-guinea-yellow/30 text-xs font-mono">
              🧪 SANDBOX SIMULATION
            </Badge>
            <AnimatePresence mode="wait">
              <motion.div
                key={sandboxStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                {sandboxStep === 'success' ? (
                  <CheckCircle2 className="h-6 w-6 text-guinea-green" />
                ) : (
                  <Loader2 className="h-6 w-6 text-guinea-yellow animate-spin" />
                )}
                <span className={`text-sm font-medium ${sandboxStep === 'success' ? 'text-guinea-green' : 'text-foreground'}`}>
                  {SANDBOX_STEPS.find((s) => s.status === sandboxStep)?.label}
                </span>
              </motion.div>
            </AnimatePresence>
            <Progress value={sandboxProgress} className="h-2" />
            {sandboxStep === 'success' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground font-mono"
              >
                TX: SANDBOX_SUB_{plan.id.toUpperCase()}_{Date.now()}
              </motion.p>
            )}
          </motion.div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={processing || (needsPhone && !phone.trim())}>
            {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {plan.price === 0 ? 'Confirmer' : isSandbox ? '🧪 Simuler le paiement' : 'Payer & activer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}