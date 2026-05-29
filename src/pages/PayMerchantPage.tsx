import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Store, ShieldCheck, CheckCircle2, Loader2, ArrowLeft, Smartphone, Wallet, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { fetchDocument } from "@/lib/firebase/queries";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/currency";

interface SellerPublicDoc {
  id: string;
  shopName?: string;
  name?: string;
  logo?: string;
  verified?: boolean;
  commune?: string;
}

interface SellerSettingsPublic {
  id: string;
  storeInfo?: { name?: string; phone?: string };
}

type PayMethod = "orange" | "mtn" | "wallet";

const METHODS: { id: PayMethod; label: string; icon: any; color: string }[] = [
  { id: "orange", label: "Orange Money", icon: Smartphone, color: "bg-orange-500" },
  { id: "mtn", label: "MTN MoMo", icon: Smartphone, color: "bg-yellow-500" },
  { id: "wallet", label: "Sarematy Wallet", icon: Wallet, color: "bg-primary" },
];

const PayMerchantPage = () => {
  const { sellerId = "" } = useParams<{ sellerId: string }>();
  const { user } = useAuth();
  const [shopName, setShopName] = useState("Boutique");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [method, setMethod] = useState<PayMethod>("orange");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!sellerId) return;
      try {
        // Public sellers collection first
        const seller = await fetchDocument<SellerPublicDoc>("sellers", sellerId);
        if (!cancelled && seller) {
          setShopName(seller.shopName || seller.name || "Boutique");
          setVerified(!!seller.verified);
        } else {
          // Fallback to seller_settings (owner reads only — may fail silently for guests)
          try {
            const s = await fetchDocument<SellerSettingsPublic>("seller_settings", sellerId);
            if (!cancelled && s?.storeInfo?.name) setShopName(s.storeInfo.name);
          } catch {
            /* ignore */
          }
        }
      } catch (e) {
        console.warn("[Pay] seller load failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  const validate = (): string | null => {
    const n = Number(amount);
    if (!n || n < 100) return "Montant minimum : 100 GNF";
    if (n > 50_000_000) return "Montant maximum : 50 000 000 GNF";
    if (method !== "wallet") {
      const p = buyerPhone.replace(/\D/g, "");
      if (!/^[63]\d{8}$/.test(p)) return "Numéro invalide (9 chiffres, commence par 6 ou 3)";
    } else if (!user) {
      return "Connectez-vous pour payer avec Sarematy Wallet";
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const ref = await addDoc(collection(db, "merchant_qr_payments"), {
        sellerId,
        shopName,
        amount: Number(amount),
        currency: "GNF",
        method,
        note: note.trim() || null,
        buyerPhone: method !== "wallet" ? buyerPhone.replace(/\D/g, "") : null,
        buyerUid: user?.uid || null,
        buyerName: user?.displayName || null,
        status: "pending",
        source: "qr_static",
        createdAt: serverTimestamp(),
      });
      setSuccess(ref.id);
      toast.success("Demande de paiement envoyée");
    } catch (e: any) {
      console.error("[Pay] submit failed", e);
      toast.error(e.message || "Erreur lors de l'envoi du paiement");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-display font-bold">Paiement initié</h2>
              <p className="text-muted-foreground text-sm">
                Votre demande a été envoyée. Vous allez recevoir une notification de votre opérateur pour confirmer le paiement de{" "}
                <strong>{formatCurrency(Number(amount), "GNF")}</strong> à <strong>{shopName}</strong>.
              </p>
              <Badge variant="outline" className="font-mono text-xs">Réf: {success.slice(0, 10)}</Badge>
              <div className="pt-4 space-y-2">
                <Button asChild className="w-full">
                  <Link to="/">Retour à l'accueil</Link>
                </Button>
                {user && (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/orders">Mes paiements</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-lg mx-auto p-4 pt-8">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Accueil
        </Link>

        {/* Seller header */}
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card className="mb-4 overflow-hidden">
            <div className="h-2 bg-primary-gradient" />
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-primary-gradient flex items-center justify-center flex-shrink-0">
                <Store className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display font-bold text-lg truncate">
                  {loading ? "Chargement…" : shopName}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  {verified && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <ShieldCheck className="w-3 h-3 text-primary" /> Vérifié
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">Payer la boutique</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Amount */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Montant à payer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-3xl font-bold h-16 text-center pr-16"
                min={100}
                max={50_000_000}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                GNF
              </span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {[5000, 10000, 25000, 50000, 100000].map((v) => (
                <Button
                  key={v}
                  size="sm"
                  variant="outline"
                  onClick={() => setAmount(String(v))}
                  className="text-xs"
                >
                  {formatCurrency(v, "GNF")}
                </Button>
              ))}
            </div>
            <div>
              <Label className="text-xs">Note (optionnelle)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Achat 2 kg de riz"
                rows={2}
                maxLength={140}
                className="resize-none mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment method */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Moyen de paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      active
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${m.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-center">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {method !== "wallet" && (
              <div>
                <Label htmlFor="phone" className="text-xs">
                  Votre numéro {method === "orange" ? "Orange" : "MTN"}
                </Label>
                <div className="flex items-center mt-1">
                  <span className="px-3 py-2 bg-muted border border-r-0 border-input rounded-l-md text-sm text-muted-foreground">
                    +224
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="6XX XXX XXX"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    maxLength={11}
                    className="rounded-l-none"
                  />
                </div>
              </div>
            )}

            {method === "wallet" && !user && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs">
                <Link to={`/login?redirect=/pay/${sellerId}`} className="font-semibold text-amber-700 dark:text-amber-300 underline">
                  Connectez-vous
                </Link>{" "}
                pour payer avec votre Sarematy Wallet.
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handleSubmit}
          disabled={submitting || !amount}
          size="lg"
          className="w-full h-14 text-base font-bold"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Traitement…
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Payer {amount ? formatCurrency(Number(amount), "GNF") : ""}
            </>
          )}
        </Button>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5" />
          Paiement sécurisé via Sarematy Marketplace
        </div>
      </div>
    </div>
  );
};

export default PayMerchantPage;
