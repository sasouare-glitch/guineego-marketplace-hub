import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, Share2, Copy, QrCode, Store, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDocument } from "@/lib/firebase/queries";

interface SellerSettingsDoc {
  id: string;
  storeInfo?: { name?: string; phone?: string };
}

const SellerQRCodePage = () => {
  const { user, claims } = useAuth();
  const sellerId = claims?.ecomId || user?.uid || "";
  const [shopName, setShopName] = useState<string>("Ma boutique");
  const [phone, setPhone] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  const payUrl = `${window.location.origin}/pay/${sellerId}`;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.uid) return;
      try {
        const settings = await fetchDocument<SellerSettingsDoc>("seller_settings", user.uid);
        if (cancelled) return;
        if (settings?.storeInfo?.name) setShopName(settings.storeInfo.name);
        if (settings?.storeInfo?.phone) setPhone(settings.storeInfo.phone);
      } catch (e) {
        console.warn("[QR] settings load failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(payUrl);
    toast.success("Lien copié");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Payer ${shopName}`,
          text: `Scannez ou ouvrez ce lien pour payer ${shopName} sur Sarematy`,
          url: payUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
  };

  const handleDownload = () => {
    const svg = svgWrapperRef.current?.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-paiement-${shopName.replace(/\s+/g, "-").toLowerCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("QR Code téléchargé");
  };

  const handlePrint = () => {
    const svg = svgWrapperRef.current?.querySelector("svg");
    if (!svg) return;
    const svgStr = new XMLSerializer().serializeToString(svg);
    const w = window.open("", "_blank", "width=600,height=800");
    if (!w) return;
    w.document.write(`
      <html><head><title>QR Paiement - ${shopName}</title>
      <style>
        body{font-family:system-ui,sans-serif;text-align:center;padding:40px;}
        h1{font-size:24px;margin:0 0 8px;}
        p{color:#555;margin:4px 0;}
        .qr{margin:24px auto;width:320px;height:320px;}
        .url{margin-top:16px;font-size:12px;color:#888;word-break:break-all;}
        .brand{margin-top:24px;font-weight:bold;color:#c4172d;}
      </style></head>
      <body>
        <h1>${shopName}</h1>
        <p>Scannez pour payer</p>
        <div class="qr">${svgStr}</div>
        <p><strong>Orange Money · MTN MoMo · Sarematy Wallet</strong></p>
        <div class="url">${payUrl}</div>
        <div class="brand">Sarematy Marketplace</div>
        <script>window.onload=()=>{window.print();}</script>
      </body></html>
    `);
    w.document.close();
  };

  return (
    <SellerLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <QrCode className="w-7 h-7 text-primary" />
            QR Code de paiement
          </h1>
          <p className="text-muted-foreground mt-1">
            Affichez ce QR Code en boutique. Vos clients scannent et paient directement via Orange Money, MTN MoMo ou Sarematy Wallet.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="w-5 h-5 text-primary" />
                {loading ? "Chargement…" : shopName}
              </CardTitle>
              <CardDescription>
                Code unique de votre boutique — valable à vie
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div
                ref={svgWrapperRef}
                className="bg-white p-4 rounded-xl border-2 border-border shadow-sm"
              >
                {sellerId ? (
                  <QRCodeSVG
                    value={payUrl}
                    size={240}
                    level="H"
                    includeMargin={false}
                    bgColor="#FFFFFF"
                    fgColor="#1a1a1a"
                    imageSettings={{
                      src: "/icons/icon-192.png",
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                ) : (
                  <div className="w-60 h-60 bg-muted animate-pulse rounded" />
                )}
              </div>
              <Badge variant="outline" className="gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                ID Vendeur: <span className="font-mono">{sellerId.slice(0, 12)}…</span>
              </Badge>
              <div className="w-full bg-muted rounded-lg p-3 flex items-center gap-2">
                <code className="text-xs flex-1 truncate text-muted-foreground">{payUrl}</code>
                <Button size="sm" variant="ghost" onClick={handleCopy}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Utilisation</CardTitle>
              <CardDescription>Téléchargez, imprimez ou partagez votre QR Code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleDownload} className="w-full justify-start" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Télécharger (SVG haute qualité)
              </Button>
              <Button onClick={handlePrint} className="w-full justify-start" variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Imprimer pour la boutique
              </Button>
              <Button onClick={handleShare} className="w-full justify-start" variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Partager le lien de paiement
              </Button>

              <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-foreground">💡 Comment ça marche</p>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>Affichez le QR Code en évidence sur votre comptoir</li>
                  <li>Le client le scanne avec l'appareil photo de son téléphone</li>
                  <li>Il saisit le montant et choisit son moyen de paiement</li>
                  <li>Vous recevez une notification de confirmation instantanée</li>
                  <li>L'argent est crédité sur votre Sarematy Wallet</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerQRCodePage;
