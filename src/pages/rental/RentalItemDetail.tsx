import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Shield, CalendarDays } from "lucide-react";
import type { RentalItem } from "@/types/rental";

const formatGNF = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " GNF";

export default function RentalItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState<RentalItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, "rental_items", id));
        if (!cancelled) {
          setItem(snap.exists() ? ({ id: snap.id, ...snap.data() } as RentalItem) : null);
          setLoading(false);
        }
      } catch (e) {
        console.error("[RentalItemDetail]", e);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Link to="/rental" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Retour aux locations
          </Link>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="aspect-square w-full" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ) : !item ? (
            <div className="text-center py-16 text-muted-foreground">Équipement introuvable.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                <img
                  src={item.thumbnail || item.images?.[0] || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <h1 className="text-2xl md:text-3xl font-bold">{item.title}</h1>
                {item.location?.commune && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {item.location.commune}
                  </p>
                )}
                <div className="bg-card border rounded-xl p-4 space-y-2">
                  <p className="text-2xl font-bold text-primary">
                    {formatGNF(item.pricePerDay)}<span className="text-sm text-muted-foreground"> / jour</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Shield className="w-4 h-4" /> Caution : {formatGNF(item.deposit)}
                  </p>
                </div>
                <p className="text-foreground/80 whitespace-pre-line">{item.description}</p>
                <Button size="lg" className="w-full" disabled>
                  <CalendarDays className="w-4 h-4 mr-2" /> Réserver (bientôt)
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  La réservation en ligne sera activée à l'étape suivante (calendrier + paiement).
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
