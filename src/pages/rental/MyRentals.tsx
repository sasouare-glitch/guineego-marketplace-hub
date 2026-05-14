import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  PlayCircle,
  Flag,
  XCircle,
  AlertTriangle,
  Package,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useMyRentalBookings } from "@/hooks/useMyRentalBookings";
import type { BookingStatus, RentalBooking } from "@/types/rental";
import { cn } from "@/lib/utils";

const formatGNF = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n) + " GNF";

const toDate = (d: any): Date | null => {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (typeof d?.seconds === "number") return new Date(d.seconds * 1000);
  if (typeof d?.toDate === "function") return d.toDate();
  return null;
};

const STATUS_META: Record<
  BookingStatus,
  { label: string; icon: any; className: string }
> = {
  pending: {
    label: "En attente",
    icon: Clock,
    className: "bg-amber-500 hover:bg-amber-500 text-white",
  },
  confirmed: {
    label: "Confirmée",
    icon: CheckCircle2,
    className: "bg-blue-600 hover:bg-blue-600 text-white",
  },
  active: {
    label: "En cours",
    icon: PlayCircle,
    className: "bg-emerald-600 hover:bg-emerald-600 text-white",
  },
  completed: {
    label: "Terminée",
    icon: Flag,
    className: "bg-muted text-muted-foreground hover:bg-muted",
  },
  cancelled: {
    label: "Annulée",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive hover:bg-destructive/10",
  },
  disputed: {
    label: "Litige",
    icon: AlertTriangle,
    className: "bg-orange-600 hover:bg-orange-600 text-white",
  },
};

function BookingCard({ booking }: { booking: RentalBooking }) {
  const start = toDate(booking.startDate);
  const end = toDate(booking.endDate);
  const meta = STATUS_META[booking.status] ?? STATUS_META.pending;
  const Icon = meta.icon;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        <Link
          to={`/rental/item/${booking.itemId}`}
          className="block w-full sm:w-32 h-32 shrink-0 rounded-lg overflow-hidden bg-muted"
        >
          <img
            src={booking.itemThumbnail || "/placeholder.svg"}
            alt={booking.itemTitle}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <Link
                to={`/rental/item/${booking.itemId}`}
                className="font-semibold hover:text-primary line-clamp-1"
              >
                {booking.itemTitle}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">
                Réservation #{booking.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <Badge className={cn("gap-1 shrink-0", meta.className)}>
              <Icon className="w-3 h-3" />
              {meta.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mt-3">
            <div>
              <p className="text-xs text-muted-foreground">Du</p>
              <p className="font-medium">
                {start ? format(start, "d MMM yyyy", { locale: fr }) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Au</p>
              <p className="font-medium">
                {end ? format(end, "d MMM yyyy", { locale: fr }) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Durée</p>
              <p className="font-medium">
                {booking.totalDays} jour{booking.totalDays > 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold text-primary">
                {formatGNF(booking.totalPrice)}
              </p>
            </div>
          </div>

          {booking.deposit > 0 && booking.depositStatus && booking.depositStatus !== "none" && (
            <DepositStatusLine booking={booking} />
          )}
        </div>
      </div>
    </Card>
  );
}

function DepositStatusLine({ booking }: { booking: RentalBooking }) {
  const map: Record<string, { label: string; className: string }> = {
    held: {
      label: "Caution bloquée",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    },
    released: {
      label: "Caution restituée",
      className:
        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    },
    partial: {
      label: "Caution partiellement restituée",
      className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30",
    },
    withheld: {
      label: "Caution conservée",
      className: "bg-destructive/10 text-destructive border-destructive/30",
    },
    refunded: {
      label: "Caution remboursée",
      className: "bg-muted text-muted-foreground border-border",
    },
  };
  const meta = map[booking.depositStatus!] ?? map.held;
  const released = booking.depositAmountReleased;
  const withheld = booking.depositAmountWithheld;

  return (
    <div className={cn("mt-3 rounded-lg border px-3 py-2 text-xs flex items-start gap-2", meta.className)}>
      <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="font-medium">
          {meta.label} · {formatGNF(booking.deposit)}
        </p>
        {(released != null || withheld != null) && (
          <p className="opacity-90">
            {released != null && <>Restitué : {formatGNF(released)}</>}
            {released != null && withheld ? " · " : ""}
            {withheld ? <>Retenu : {formatGNF(withheld)}</> : null}
          </p>
        )}
        {booking.depositWithheldReason && (
          <p className="opacity-90 italic">Motif : {booking.depositWithheldReason}</p>
        )}
      </div>
    </div>
  );
}

const TABS: { id: "all" | BookingStatus; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "pending", label: "En attente" },
  { id: "confirmed", label: "Confirmées" },
  { id: "active", label: "En cours" },
  { id: "completed", label: "Terminées" },
  { id: "cancelled", label: "Annulées" },
];

export default function MyRentals() {
  const { user } = useAuth();
  const { bookings, loading } = useMyRentalBookings(user?.uid);
  const [tab, setTab] = useState<"all" | BookingStatus>("all");

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: bookings.length };
    bookings.forEach((b) => {
      map[b.status] = (map[b.status] || 0) + 1;
    });
    return map;
  }, [bookings]);

  const filtered = useMemo(
    () => (tab === "all" ? bookings : bookings.filter((b) => b.status === tab)),
    [bookings, tab]
  );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-6 md:py-10">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <CalendarDays className="w-7 h-7 text-primary" />
                Mes locations
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Suivez le statut de vos réservations d'équipements.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/rental">
                Catalogue <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          {!user ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Connectez-vous pour voir vos réservations.
              </p>
              <Button asChild>
                <Link to="/login?redirect=/my-rentals">Se connecter</Link>
              </Button>
            </Card>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                {TABS.map((t) => (
                  <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
                    {t.label}
                    {counts[t.id] ? (
                      <span className="text-xs opacity-70">({counts[t.id]})</span>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={tab} className="mt-5 space-y-3">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <Card key={i} className="p-4">
                      <div className="flex gap-4">
                        <Skeleton className="w-32 h-32 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-2/3" />
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </Card>
                  ))
                ) : filtered.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground mb-4">
                      {tab === "all"
                        ? "Vous n'avez pas encore de réservation."
                        : "Aucune réservation dans cette catégorie."}
                    </p>
                    <Button asChild>
                      <Link to="/rental">Découvrir les équipements</Link>
                    </Button>
                  </Card>
                ) : (
                  filtered.map((b) => <BookingCard key={b.id} booking={b} />)
                )}
              </TabsContent>
            </Tabs>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
