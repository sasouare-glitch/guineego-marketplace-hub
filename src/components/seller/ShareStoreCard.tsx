import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Share2, QrCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDocument } from "@/lib/firebase/queries";
import { QRCodeSVG } from "qrcode.react";

export function ShareStoreCard() {
  const { user, claims } = useAuth();
  const sellerId = useMemo(() => claims?.ecomId || user?.uid || '', [claims?.ecomId, user?.uid]);
  const [storeName, setStoreName] = useState("Ma boutique");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    fetchDocument<{ id: string; storeInfo?: { name?: string } }>("seller_settings", user.uid)
      .then((data) => {
        if (data?.storeInfo?.name) setStoreName(data.storeInfo.name);
      })
      .catch(() => {});
  }, [user?.uid]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const storeUrl = `${origin}/marketplace?seller=${sellerId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const [showQR, setShowQR] = useState(false);

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: storeName,
        text: `Découvrez ma boutique "${storeName}" sur GuineeGo !`,
        url: storeUrl,
      });
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error("Partage impossible");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="bg-card rounded-xl border border-border shadow-sm p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Share2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Partager ma boutique</h3>
          <p className="text-sm text-muted-foreground">Copiez ou partagez le lien de votre boutique</p>
        </div>
      </div>

      {/* Copy link */}
      <div className="flex gap-2 mb-3">
        <Input
          readOnly
          value={storeUrl}
          className="bg-muted text-sm font-mono"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {canShare && (
          <Button onClick={handleNativeShare} className="flex-1 gap-2">
            <Share2 className="w-4 h-4" />
            Partager
          </Button>
        )}
        <Button
          variant={showQR ? "secondary" : "outline"}
          onClick={() => setShowQR(!showQR)}
          className="gap-2"
        >
          <QrCode className="w-4 h-4" />
          QR Code
        </Button>
      </div>

      {/* QR Code */}
      {showQR && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-col items-center gap-3 pt-4 border-t border-border mt-3"
        >
          <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
            <QRCodeSVG
              value={storeUrl}
              size={160}
              level="M"
              includeMargin={false}
              bgColor="#FFFFFF"
              fgColor="#1a1a1a"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-[200px]">
            Imprimez ou affichez ce QR code en magasin pour diriger les clients vers votre boutique
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
