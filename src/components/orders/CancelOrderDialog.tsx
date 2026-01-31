import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CancelOrderDialogProps {
  orderNumber: string;
  onCancel: (reason: string) => void;
  isProcessing?: boolean;
}

const cancelReasons = [
  { id: "changed_mind", label: "J'ai changé d'avis" },
  { id: "found_better", label: "J'ai trouvé moins cher ailleurs" },
  { id: "delay", label: "Délai de livraison trop long" },
  { id: "duplicate", label: "Commande en double" },
  { id: "other", label: "Autre raison" },
];

export function CancelOrderDialog({
  orderNumber,
  onCancel,
  isProcessing = false,
}: CancelOrderDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [open, setOpen] = useState(false);

  const handleCancel = () => {
    const reason = selectedReason === "other" ? otherReason : selectedReason;
    onCancel(reason);
  };

  const canSubmit =
    selectedReason && (selectedReason !== "other" || otherReason.trim().length > 0);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
          Annuler la commande
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Annuler la commande ?</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                Commande {orderNumber}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible. Si vous avez déjà payé, le remboursement sera effectué sous 24-48h.
          </p>

          <div className="space-y-3">
            <Label>Raison de l'annulation</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {cancelReasons.map((reason) => (
                <div key={reason.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.id} id={reason.id} />
                  <Label htmlFor={reason.id} className="font-normal cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="other-reason">Précisez la raison</Label>
              <Textarea
                id="other-reason"
                placeholder="Décrivez la raison de votre annulation..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Garder la commande</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={!canSubmit || isProcessing}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isProcessing ? "Annulation..." : "Confirmer l'annulation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
