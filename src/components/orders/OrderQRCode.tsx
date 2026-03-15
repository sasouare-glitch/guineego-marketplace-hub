import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, ShieldCheck } from "lucide-react";

interface OrderQRCodeProps {
  orderId: string;
  /** "pickup" = vendeur montre au coursier, "delivery" = client montre au coursier */
  purpose: "pickup" | "delivery";
  size?: number;
  className?: string;
}

/**
 * Generates a unique, verifiable QR code payload for each order + purpose.
 * The courier scans this to confirm pickup or delivery.
 */
function buildQRPayload(orderId: string, purpose: "pickup" | "delivery"): string {
  // Simple hash-like token from orderId to prevent guessing
  const token = btoa(`${orderId}:${purpose}:guineego`).replace(/=/g, "");
  return JSON.stringify({
    app: "guineego",
    orderId,
    purpose,
    token,
  });
}

export function OrderQRCode({ orderId, purpose, size = 180, className }: OrderQRCodeProps) {
  const payload = buildQRPayload(orderId, purpose);
  const isPurposePickup = purpose === "pickup";

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          {isPurposePickup ? "QR de récupération" : "QR de livraison"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-3 rounded-xl border border-border">
          <QRCodeSVG
            value={payload}
            size={size}
            level="M"
            includeMargin={false}
            bgColor="#FFFFFF"
            fgColor="#1a1a1a"
          />
        </div>

        <div className="text-center space-y-1.5">
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="w-3 h-3" />
            {orderId}
          </Badge>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
            {isPurposePickup
              ? "Présentez ce code au coursier lors de la récupération du colis"
              : "Présentez ce code au coursier pour confirmer la réception"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
