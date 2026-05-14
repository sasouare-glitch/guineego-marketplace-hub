/**
 * Dialog: DepositReturnDialog
 * Permet au loueur de :
 *  - Confirmer le retour OK -> caution intégralement restituée (released)
 *  - Retenir une partie ou la totalité avec montant + motif (partial / withheld)
 */
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import type { DepositStatus } from "@/types/rental";

const formatGNF = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(Math.max(0, Math.round(n))) + " GNF";

export type DepositReturnDecision =
  | { kind: "released" }
  | { kind: "partial" | "withheld"; amountWithheld: number; reason: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deposit: number;
  bookingRef: string;
  loading?: boolean;
  onConfirm: (decision: DepositReturnDecision) => Promise<void> | void;
}

export function DepositReturnDialog({
  open,
  onOpenChange,
  deposit,
  bookingRef,
  loading,
  onConfirm,
}: Props) {
  const [mode, setMode] = useState<"ok" | "withhold">("ok");
  const [amountStr, setAmountStr] = useState("");
  const [reason, setReason] = useState("");

  const amount = Number(amountStr.replace(/\s/g, "")) || 0;
  const status: DepositStatus = useMemo(() => {
    if (mode === "ok") return "released";
    if (amount >= deposit) return "withheld";
    if (amount > 0) return "partial";
    return "released";
  }, [mode, amount, deposit]);

  const invalid =
    mode === "withhold" &&
    (amount <= 0 || amount > deposit || reason.trim().length < 3);

  const reset = () => {
    setMode("ok");
    setAmountStr("");
    setReason("");
  };

  const handleConfirm = async () => {
    if (mode === "ok") {
      await onConfirm({ kind: "released" });
    } else {
      const kind = amount >= deposit ? "withheld" : "partial";
      await onConfirm({ kind, amountWithheld: amount, reason: reason.trim() });
    }
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!loading) {
          onOpenChange(o);
          if (!o) reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Retour de caution
          </DialogTitle>
          <DialogDescription>
            Réservation <span className="font-mono">{bookingRef.slice(0, 8)}</span> — Caution bloquée :{" "}
            <span className="font-semibold text-foreground">{formatGNF(deposit)}</span>
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={mode} onValueChange={(v) => setMode(v as "ok" | "withhold")} className="gap-3">
          <Label
            htmlFor="dep-ok"
            className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/40 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
          >
            <RadioGroupItem id="dep-ok" value="ok" className="mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Retour OK — restituer la caution
              </div>
              <p className="text-xs text-muted-foreground">
                Le matériel est rendu en bon état. La caution de {formatGNF(deposit)} sera intégralement restituée au locataire.
              </p>
            </div>
          </Label>

          <Label
            htmlFor="dep-withhold"
            className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/40 [&:has([data-state=checked])]:border-destructive [&:has([data-state=checked])]:bg-destructive/5"
          >
            <RadioGroupItem id="dep-withhold" value="withhold" className="mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                Retenir tout ou partie de la caution
              </div>
              <p className="text-xs text-muted-foreground">
                Indiquez le montant à conserver (dégâts, retard, perte…) et le motif.
              </p>
            </div>
          </Label>
        </RadioGroup>

        {mode === "withhold" && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <div className="space-y-1.5">
              <Label htmlFor="dep-amount" className="text-xs">
                Montant retenu (GNF) — max {formatGNF(deposit)}
              </Label>
              <Input
                id="dep-amount"
                inputMode="numeric"
                placeholder="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ""))}
              />
              {amount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Restitué au locataire :{" "}
                  <span className="font-medium text-foreground">
                    {formatGNF(Math.max(0, deposit - amount))}
                  </span>
                  {" • "}Statut : <span className="font-medium text-foreground">{status}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dep-reason" className="text-xs">
                Motif (visible par le locataire)
              </Label>
              <Textarea
                id="dep-reason"
                rows={3}
                maxLength={500}
                placeholder="Ex. Rayure sur le pare-chocs, retour avec 1 jour de retard…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {amount > deposit && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-xs">
                  Le montant retenu ne peut pas dépasser la caution.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={invalid || loading}
            variant={mode === "ok" ? "default" : "destructive"}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === "ok" ? "Confirmer le retour" : "Valider la retenue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
