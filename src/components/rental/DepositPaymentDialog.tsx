/**
 * Dialog: paiement de la caution avant validation de la réservation.
 * Méthodes: Orange Money, MTN MoMo (sandbox simulé), Carte bancaire (placeholder Stripe).
 */
import { useState } from "react";
import { Loader2, Shield, Smartphone, CreditCard, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { usePaymentSandbox } from "@/hooks/usePaymentSandbox";
import { toast } from "sonner";
import type { DepositPaymentMethod } from "@/types/rental";

const formatGNF = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n) + " GNF";

// Validation locale (9 chiffres commençant par 6 ou 3)
const PHONE_RE = /^[63]\d{8}$/;

export interface DepositPaymentResult {
  method: DepositPaymentMethod;
  transactionId: string;
  amount: number;
  phone?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  bookingRef: string;
  onPaid: (result: DepositPaymentResult) => void | Promise<void>;
}

export function DepositPaymentDialog({
  open,
  onOpenChange,
  amount,
  bookingRef,
  onPaid,
}: Props) {
  const [method, setMethod] = useState<DepositPaymentMethod>("orange_money");
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "" });
  const [submitting, setSubmitting] = useState(false);

  const { sandboxStatus, sandboxProgress, simulatePayment, resetSandbox } =
    usePaymentSandbox();

  const handleMobileMoney = async (m: "orange_money" | "mtn_money") => {
    const cleaned = phone.replace(/\D/g, "").slice(-9);
    if (!PHONE_RE.test(cleaned)) {
      toast.error("Numéro invalide", {
        description: "9 chiffres commençant par 6 ou 3.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await simulatePayment({
        method: m,
        phone: cleaned,
        amount,
        orderId: bookingRef,
      });
      if (!res.success) throw new Error("Paiement refusé");
      await onPaid({
        method: m,
        transactionId: res.transactionId,
        amount,
        phone: cleaned,
      });
      toast.success("Caution réglée", { description: "Votre réservation est confirmée." });
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Échec du paiement", { description: e?.message ?? "Réessayez." });
    } finally {
      setSubmitting(false);
      resetSandbox();
    }
  };

  const handleCard = async () => {
    const num = card.number.replace(/\s/g, "");
    if (num.length < 12 || !card.expiry || card.cvc.length < 3) {
      toast.error("Coordonnées de carte incomplètes");
      return;
    }
    setSubmitting(true);
    try {
      // Simulation : à remplacer par un appel à une Cloud Function Stripe.
      await new Promise((r) => setTimeout(r, 1500));
      const txId = `SANDBOX_CARD_${Date.now()}`;
      await onPaid({ method: "card", transactionId: txId, amount });
      toast.success("Caution réglée", { description: "Votre réservation est confirmée." });
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Échec du paiement", { description: e?.message ?? "Réessayez." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Paiement de la caution
          </DialogTitle>
          <DialogDescription>
            Caution remboursable de{" "}
            <span className="font-semibold text-foreground">{formatGNF(amount)}</span>{" "}
            bloquée jusqu'au retour de l'équipement.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={method} onValueChange={(v) => setMethod(v as DepositPaymentMethod)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="orange_money" className="text-xs">
              <Smartphone className="w-3.5 h-3.5 mr-1" /> Orange
            </TabsTrigger>
            <TabsTrigger value="mtn_money" className="text-xs">
              <Smartphone className="w-3.5 h-3.5 mr-1" /> MTN
            </TabsTrigger>
            <TabsTrigger value="card" className="text-xs">
              <CreditCard className="w-3.5 h-3.5 mr-1" /> Carte
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orange_money" className="space-y-3 mt-4">
            <Label htmlFor="om-phone">Numéro Orange Money</Label>
            <Input
              id="om-phone"
              inputMode="tel"
              placeholder="6XX XX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={submitting}
            />
            <Button
              className="w-full"
              onClick={() => handleMobileMoney("orange_money")}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Smartphone className="w-4 h-4 mr-2" />
              )}
              Payer {formatGNF(amount)} via Orange Money
            </Button>
          </TabsContent>

          <TabsContent value="mtn_money" className="space-y-3 mt-4">
            <Label htmlFor="mtn-phone">Numéro MTN MoMo</Label>
            <Input
              id="mtn-phone"
              inputMode="tel"
              placeholder="6XX XX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={submitting}
            />
            <Button
              className="w-full"
              onClick={() => handleMobileMoney("mtn_money")}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Smartphone className="w-4 h-4 mr-2" />
              )}
              Payer {formatGNF(amount)} via MTN MoMo
            </Button>
          </TabsContent>

          <TabsContent value="card" className="space-y-3 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="card-num">Numéro de carte</Label>
              <Input
                id="card-num"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: e.target.value })}
                disabled={submitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="card-exp">Expiration</Label>
                <Input
                  id="card-exp"
                  placeholder="MM/AA"
                  value={card.expiry}
                  onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-cvc">CVC</Label>
                <Input
                  id="card-cvc"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="123"
                  value={card.cvc}
                  onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleCard} disabled={submitting}>
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              Payer {formatGNF(amount)} par carte
            </Button>
          </TabsContent>
        </Tabs>

        {submitting && sandboxStatus !== "idle" && method !== "card" && (
          <div className="space-y-2 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2 text-sm">
              {sandboxStatus === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span className="capitalize">
                {sandboxStatus.replace(/_/g, " ")}…
              </span>
            </div>
            <Progress value={sandboxProgress} className="h-1.5" />
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center">
          La caution sera restituée intégralement après contrôle de l'équipement au retour.
        </p>
      </DialogContent>
    </Dialog>
  );
}
