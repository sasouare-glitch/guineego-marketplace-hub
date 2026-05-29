import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, MapPin, Phone, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { safeOnSnapshot } from "@/lib/firebase/safeSnapshot";
import { Skeleton } from "@/components/ui/skeleton";

interface ShopInfoCardProps {
  sellerId: string;
}

interface StoreInfo {
  name?: string;
  phone?: string;
  description?: string;
  address?: string;
}

export const ShopInfoCard = ({ sellerId }: ShopInfoCardProps) => {
  const [info, setInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    const ref = doc(db, "seller_settings", sellerId);
    const unsub = safeOnSnapshot(
      ref,
      (snap: any) => {
        if (snap.exists()) {
          const d = snap.data();
          setInfo(d?.storeInfo || null);
        } else {
          setInfo(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("[ShopInfoCard] snapshot error", err);
        setLoading(false);
      },
      "seller_settings_profile"
    );
    return () => unsub();
  }, [sellerId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Store className="h-5 w-5 text-primary" />
          Ma boutique
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link to="/seller/settings">
            <Pencil className="h-4 w-4 mr-1" /> Modifier
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </>
        ) : info?.name ? (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-display font-bold text-foreground">{info.name}</h3>
              <Badge variant="outline" className="text-xs">Active</Badge>
            </div>
            {info.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{info.description}</p>
            )}
            <div className="space-y-1.5 text-sm text-muted-foreground pt-1">
              {info.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{info.address}</span>
                </div>
              )}
              {info.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>+224 {info.phone}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Aucune boutique configurée pour le moment.
            </p>
            <Button asChild size="sm">
              <Link to="/seller/settings">Configurer ma boutique</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
