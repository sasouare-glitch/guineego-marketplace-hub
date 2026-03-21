/**
 * WithdrawalDialog — Shared withdrawal request dialog with Sandbox simulation
 * Used by both seller (SellerFinances) and courier (CourierEarnings)
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Smartphone,
  Wallet,
  Loader2,
  AlertCircle,
  FlaskConical,
  CheckCircle2,
  ArrowUpFromLine,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type WithdrawalMethod = "orange_money" | "mtn_money" | "cash" | "sandbox";

type SandboxStep = "idle" | "initiating" | "verifying" | "processing" | "transferring" | "success";

const SANDBOX_STEPS: { status: SandboxStep; label: string; delay: number; progress: number }[] = [
  { status: "initiating", label: "Connexion au service de paiement...", delay: 900, progress: 15 },
  { status: "verifying", label: "Vérification du solde wallet...", delay: 800, progress: 35 },
  { status: "processing", label: "Traitement de la demande...", delay: 1100, progress: 60 },
  { status: "transferring", label: "Transfert en cours...", delay: 1200, progress: 85 },
  { status: "success", label: "Retrait effectué avec succès !", delay: 0, progress: 100 },
];

interface WithdrawalLimits {
  minAmount: number;
  maxAmount: number;
  feePercent: number;
}

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  limits: WithdrawalLimits;
  onSubmit: (data: { amount: number; method: "orange_money" | "mtn_money" | "cash"; phone?: string }) => void;
  isSubmitting?: boolean;
  /** Unique ID prefix for radio buttons (avoids conflicts when 2 dialogs exist) */
  idPrefix?: string;
  formatAmount?: (amount: number) => string;
}

export function WithdrawalDialog({
  open,
  onOpenChange,
  availableBalance,
  limits,
  onSubmit,
  isSubmitting = false,
  idPrefix = "wd",
  formatAmount = (a) => `${a.toLocaleString("fr-GN")} GNF`,
}: WithdrawalDialogProps) {
  const [method, setMethod] = useState<WithdrawalMethod>("orange_money");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [sandboxStep, setSandboxStep] = useState<SandboxStep>("idle");
  const [sandboxProgress, setSandboxProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const isSandbox = method === "sandbox";
  const isMobileMoney = method === "orange_money" || method === "mtn_money";

  const resetForm = () => {
    setAmount("");
    setPhone("");
    setMethod("orange_money");
    setSandboxStep("idle");
    setSandboxProgress(0);
    setProcessing(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const simulateSandboxWithdrawal = async () => {
    for (const step of SANDBOX_STEPS) {
      await new Promise((r) => setTimeout(r, step.delay));
      setSandboxStep(step.status);
      setSandboxProgress(step.progress);
    }
  };

  const validate = (): boolean => {
    const parsed = parseInt(amount);
    if (!parsed || parsed <= 0) {
      toast.error("Montant invalide");
      return false;
    }
    if (parsed < limits.minAmount) {
      toast.error(`Montant minimum: ${limits.minAmount.toLocaleString()} GNF`);
      return false;
    }
    if (parsed > limits.maxAmount) {
      toast.error(`Montant maximum: ${limits.maxAmount.toLocaleString()} GNF`);
      return false;
    }
    if (parsed > availableBalance) {
      toast.error("Solde insuffisant");
      return false;
    }
    if (!isSandbox && isMobileMoney && !phone.trim()) {
      toast.error("Numéro de téléphone requis");
      return false;
    }
    return true;
  };

  const handleConfirm = async () => {
    if (!validate()) return;

    const parsed = parseInt(amount);

    if (isSandbox) {
      setProcessing(true);
      try {
        await simulateSandboxWithdrawal();
        await new Promise((r) => setTimeout(r, 900));
        const txId = `SANDBOX_WD_${Date.now().toString(36).toUpperCase()}`;
        toast.success("🧪 Retrait sandbox réussi", {
          description: `${formatAmount(parsed)} · Réf: ${txId}`,
        });
        handleClose(false);
      } finally {
        setProcessing(false);
        setSandboxStep("idle");
        setSandboxProgress(0);
      }
      return;
    }

    // Real withdrawal
    const realMethod = method as "orange_money" | "mtn_money" | "cash";
    onSubmit({
      amount: parsed,
      method: realMethod,
      phone: realMethod !== "cash" ? phone : undefined,
    });
    handleClose(false);
  };

  const fee = Math.max(
    Math.round((parseInt(amount) || 0) * limits.feePercent / 100),
    0
  );
  const netAmount = Math.max((parseInt(amount) || 0) - fee, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpFromLine className="w-5 h-5 text-primary" />
            Demande de retrait
          </DialogTitle>
          <DialogDescription>
            Solde disponible: {formatAmount(availableBalance)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Limits info */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
            <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Min: {formatAmount(limits.minAmount)} · Max: {formatAmount(limits.maxAmount)} · Frais: {limits.feePercent}%
            </p>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Montant à retirer</Label>
            <Input
              type="number"
              placeholder={`Min: ${limits.minAmount.toLocaleString()} GNF`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={limits.minAmount}
              max={Math.min(limits.maxAmount, availableBalance)}
              disabled={processing}
            />
            {parseInt(amount) > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Frais: {formatAmount(fee)}</span>
                <span className="font-medium text-foreground">Net: {formatAmount(netAmount)}</span>
              </div>
            )}
          </div>

          {/* Method — 4 options including sandbox */}
          <div className="space-y-2">
            <Label>Mode de retrait</Label>
            <RadioGroup
              value={method}
              onValueChange={(v) => setMethod(v as WithdrawalMethod)}
              className="grid grid-cols-2 gap-3"
              disabled={processing}
            >
              {/* Orange Money */}
              <div>
                <RadioGroupItem value="orange_money" id={`${idPrefix}-orange`} className="peer sr-only" />
                <Label
                  htmlFor={`${idPrefix}-orange`}
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                >
                  <Smartphone className="mb-1.5 h-5 w-5 text-[#FF6600]" />
                  <span className="text-xs font-medium">Orange Money</span>
                </Label>
              </div>

              {/* MTN Money */}
              <div>
                <RadioGroupItem value="mtn_money" id={`${idPrefix}-mtn`} className="peer sr-only" />
                <Label
                  htmlFor={`${idPrefix}-mtn`}
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                >
                  <Smartphone className="mb-1.5 h-5 w-5 text-[#FFCC00]" />
                  <span className="text-xs font-medium">MTN Money</span>
                </Label>
              </div>

              {/* Cash */}
              <div>
                <RadioGroupItem value="cash" id={`${idPrefix}-cash`} className="peer sr-only" />
                <Label
                  htmlFor={`${idPrefix}-cash`}
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                >
                  <Wallet className="mb-1.5 h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">Cash</span>
                </Label>
              </div>

              {/* Sandbox */}
              <div>
                <RadioGroupItem value="sandbox" id={`${idPrefix}-sandbox`} className="peer sr-only" />
                <Label
                  htmlFor={`${idPrefix}-sandbox`}
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-guinea-yellow [&:has([data-state=checked])]:border-guinea-yellow [&:has([data-state=checked])]:bg-guinea-yellow/5 cursor-pointer transition-colors relative"
                >
                  <FlaskConical className="mb-1.5 h-5 w-5 text-guinea-yellow" />
                  <span className="text-xs font-medium">Sandbox</span>
                  <Badge
                    variant="outline"
                    className="absolute -top-2 -right-2 bg-guinea-yellow/10 text-guinea-yellow border-guinea-yellow/30 text-[9px] font-mono px-1.5 py-0"
                  >
                    🧪
                  </Badge>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Phone (for mobile money, non-sandbox) */}
          {!isSandbox && isMobileMoney && (
            <div className="space-y-2">
              <Label>Numéro de téléphone</Label>
              <Input
                placeholder="6XX XX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={processing}
              />
            </div>
          )}

          {/* Sandbox info */}
          {isSandbox && sandboxStep === "idle" && (
            <div className="rounded-lg border-2 border-dashed border-guinea-yellow/40 bg-guinea-yellow/5 p-3 space-y-1">
              <p className="text-sm font-medium text-guinea-yellow flex items-center gap-2">
                <FlaskConical className="h-4 w-4" /> Mode Sandbox (Simulation)
              </p>
              <p className="text-xs text-muted-foreground">
                Aucun retrait réel ne sera effectué. Ce mode permet de tester le flux complet de demande de retrait.
              </p>
            </div>
          )}

          {/* Sandbox simulation progress */}
          {isSandbox && sandboxStep !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 rounded-lg border border-guinea-yellow/30 bg-guinea-yellow/5 p-4"
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
                  {sandboxStep === "success" ? (
                    <CheckCircle2 className="h-6 w-6 text-guinea-green shrink-0" />
                  ) : (
                    <Loader2 className="h-6 w-6 text-guinea-yellow animate-spin shrink-0" />
                  )}
                  <span className={cn("text-sm font-medium", sandboxStep === "success" ? "text-guinea-green" : "text-foreground")}>
                    {SANDBOX_STEPS.find((s) => s.status === sandboxStep)?.label}
                  </span>
                </motion.div>
              </AnimatePresence>
              <Progress value={sandboxProgress} className="h-2" />
              {sandboxStep === "success" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground space-y-1 pt-1">
                  <p>💰 Montant: <strong>{formatAmount(parseInt(amount) || 0)}</strong></p>
                  <p>📱 Méthode: <strong>Sandbox (Test)</strong></p>
                  <p>🆔 Réf: <strong className="font-mono text-guinea-yellow">SANDBOX_WD_{Date.now().toString(36).toUpperCase().slice(0, 6)}</strong></p>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={processing}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={processing || isSubmitting}
            className={isSandbox ? "bg-guinea-yellow hover:bg-guinea-yellow/90 text-guinea-yellow-foreground" : ""}
          >
            {(processing || isSubmitting) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isSandbox ? "🧪 Simuler le retrait" : "Confirmer le retrait"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
