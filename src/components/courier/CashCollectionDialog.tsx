import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  PenLine,
  Check,
  Banknote,
  Trash2,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ProofMode = "choose" | "photo" | "signature" | "confirm";

interface CashCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (proof: { type: "photo" | "signature"; dataUrl: string }) => void;
  amount: number;
  customerName?: string;
}

export const CashCollectionDialog = ({
  open,
  onOpenChange,
  onConfirm,
  amount,
  customerName,
}: CashCollectionDialogProps) => {
  const [mode, setMode] = useState<ProofMode>("choose");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Camera
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const formatPrice = (p: number) => p.toLocaleString("fr-GN") + " GNF";

  const reset = () => {
    setMode("choose");
    setPhotoData(null);
    setSignatureData(null);
    setSubmitting(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  // ─── Photo ───
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoData(reader.result as string);
      setMode("confirm");
    };
    reader.readAsDataURL(file);
  };

  // ─── Signature canvas helpers ───
  const getCanvasPos = (
    e: React.TouchEvent | React.MouseEvent,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      isDrawingRef.current = true;
      lastPosRef.current = getCanvasPos(e, canvas);
    },
    []
  );

  const draw = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDrawingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pos = getCanvasPos(e, canvas);
      const last = lastPosRef.current;
      if (last) {
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = "hsl(var(--foreground))";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      lastPosRef.current = pos;
    },
    []
  );

  const endDraw = useCallback(() => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  }, []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const confirmSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureData(canvas.toDataURL("image/png"));
    setMode("confirm");
  };

  // ─── Submit ───
  const handleSubmit = async () => {
    const proof = photoData
      ? { type: "photo" as const, dataUrl: photoData }
      : signatureData
      ? { type: "signature" as const, dataUrl: signatureData }
      : null;
    if (!proof) return;
    setSubmitting(true);
    try {
      await onConfirm(proof);
      handleOpenChange(false);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Banknote className="w-5 h-5 text-guinea-green" />
            Collecte Cash
          </DialogTitle>
          <DialogDescription>
            Confirmez la réception de{" "}
            <span className="font-bold text-foreground">{formatPrice(amount)}</span>
            {customerName && (
              <>
                {" "}de <span className="font-semibold">{customerName}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ─── Choose mode ─── */}
          {mode === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3 pt-2"
            >
              <p className="text-sm text-muted-foreground text-center">
                Fournissez une preuve de collecte
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setMode("photo");
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-2xl border-2",
                    "border-guinea-green/30 bg-guinea-green/5 hover:bg-guinea-green/10",
                    "transition-colors"
                  )}
                >
                  <div className="w-14 h-14 rounded-full bg-guinea-green/20 flex items-center justify-center">
                    <Camera className="w-7 h-7 text-guinea-green" />
                  </div>
                  <span className="font-bold text-sm">Photo</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Prenez une photo des billets
                  </span>
                </button>
                <button
                  onClick={() => setMode("signature")}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-2xl border-2",
                    "border-accent/30 bg-accent/5 hover:bg-accent/10",
                    "transition-colors"
                  )}
                >
                  <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
                    <PenLine className="w-7 h-7 text-accent" />
                  </div>
                  <span className="font-bold text-sm">Signature</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Signature du client
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Photo mode (hidden input) ─── */}
          {mode === "photo" && (
            <motion.div
              key="photo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <Camera className="w-12 h-12 text-muted-foreground animate-pulse" />
              <p className="text-sm text-muted-foreground">Ouverture de la caméra…</p>
              <Button variant="outline" onClick={() => setMode("choose")}>
                Retour
              </Button>
            </motion.div>
          )}

          {/* ─── Signature mode ─── */}
          {mode === "signature" && (
            <motion.div
              key="signature"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground text-center">
                Demandez au client de signer ci-dessous
              </p>
              <div className="relative border-2 border-dashed border-border rounded-xl overflow-hidden bg-muted/30">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={200}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                />
                <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/50 pointer-events-none">
                  Signez ici
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode("choose")}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                  className="gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Effacer
                </Button>
                <Button
                  size="sm"
                  onClick={confirmSignature}
                  className="flex-1 bg-guinea-green hover:bg-guinea-green/90 gap-1"
                >
                  <Check className="w-4 h-4" />
                  Valider
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── Confirm ─── */}
          {mode === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Preview */}
              <div className="rounded-xl overflow-hidden border border-border">
                {photoData && (
                  <img
                    src={photoData}
                    alt="Preuve photo"
                    className="w-full max-h-48 object-cover"
                  />
                )}
                {signatureData && (
                  <div className="bg-muted/30 p-4">
                    <img
                      src={signatureData}
                      alt="Signature"
                      className="w-full max-h-32 object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="bg-guinea-green/10 rounded-xl p-4 text-center">
                <p className="text-sm font-medium">Montant collecté</p>
                <p className="text-2xl font-bold text-guinea-green">
                  {formatPrice(amount)}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPhotoData(null);
                    setSignatureData(null);
                    setMode("choose");
                  }}
                  className="flex-1 gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Reprendre
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-guinea-green hover:bg-guinea-green/90 gap-1"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Confirmer la collecte
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file input for camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoCapture}
        />
      </DialogContent>
    </Dialog>
  );
};
