import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link2, Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDocument } from "@/lib/firebase/queries";

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
          <p className="text-sm text-muted-foreground">Copiez le lien de votre boutique</p>
        </div>
      </div>

      {/* Copy link */}
      <div className="flex gap-2">
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
    </motion.div>
  );
}
