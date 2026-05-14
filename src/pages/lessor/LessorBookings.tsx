/**
 * Page: LessorBookings
 * Back-office du loueur — liste des réservations, action de retour de caution.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { doc, updateDoc, serverTimestamp, addDoc, collection, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  PlayCircle,
  Flag,
  XCircle,
  AlertTriangle,
  Package,
  Shield,
  ShieldCheck,
  ShieldAlert,
  History,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLessorRentalBookings } from "@/hooks/useLessorRentalBookings";
import {
  DepositReturnDialog,
  type DepositReturnDecision,
} from "@/components/rental/DepositReturnDialog";
import type { BookingStatus, RentalBooking, DepositStatus, DepositReturnAudit } from "@/types/rental";
import { useToast } from "@/hooks/use-toast";
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

const STATUS_META: Record<BookingStatus, { label: string; icon: any; className: string }> = {
  pending:   { label: "En attente",  icon: Clock,         className: "bg-amber-500 hover:bg-amber-500 text-white" },
  confirmed: { label: "Confirmée",   icon: CheckCircle2,  className: "bg-blue-600 hover:bg-blue-600 text-white" },
  active:    { label: "En cours",    icon: PlayCircle,    className: "bg-emerald-600 hover:bg-emerald-600 text-white" },
  completed: { label: "Terminée",    icon: Flag,          className: "bg-muted text-muted-foreground hover:bg-muted" },
  cancelled: { label: "Annulée",     icon: XCircle,       className: "bg-destructive/10 text-destructive hover:bg-destructive/10" },
  disputed:  { label: "Litige",      icon: AlertTriangle, className: "bg-orange-600 hover:bg-orange-600 text-white" },
};

const DEPOSIT_META: Record<DepositStatus, { label: string; className: string; icon: any }> = {
  none:     { label: "Sans caution",  className: "bg-muted text-muted-foreground", icon: Shield },
  held:     { label: "Bloquée",       className: "bg-amber-500/10 text-amber-700 dark:text-amber-400", icon: Shield },
  released: { label: "Restituée",     className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", icon: ShieldCheck },
  partial:  { label: "Partiellement retenue", className: "bg-orange-500/10 text-orange-700 dark:text-orange-400", icon: ShieldAlert },
  withheld: { label: "Retenue",       className: "bg-destructive/10 text-destructive", icon: ShieldAlert },
  refunded: { label: "Remboursée",    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400", icon: Shield },
};

function BookingRow({
  booking,
  onReturn,
}: {
  booking: RentalBooking;
  onReturn: (b: RentalBooking) => void;
}) {
  const start = toDate(booking.startDate);
  const end = toDate(booking.endDate);
  const meta = STATUS_META[booking.status] ?? STATUS_META.pending;
  const Icon = meta.icon;
  const depStatus: DepositStatus = booking.depositStatus ?? (booking.deposit > 0 ? "none" : "none");
  const depMeta = DEPOSIT_META[depStatus];
  const DepIcon = depMeta.icon;

  const canReturn =
    (booking.status === "active" || booking.status === "confirmed") &&
    depStatus === "held";

  const latestAudit = booking.depositReturnAudits?.[booking.depositReturnAudits.length - 1];

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-md bg-muted shrink-0 overflow-hidden">
          {booking.itemThumbnail ? (
            <img src={booking.itemThumbnail} alt={booking.itemTitle} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/rental/item/${booking.itemId}`} className="font-medium truncate hover:underline">
              {booking.itemTitle}
            </Link>
            <Badge className={cn("shrink-0", meta.className)}>
              <Icon className="w-3 h-3 mr-1" /> {meta.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Locataire : {booking.renterName || booking.renterId.slice(0, 6)}
            {booking.renterPhone ? ` • ${booking.renterPhone}` : ""}
          </p>
          {start && end && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <CalendarDays className="w-3 h-3" />
              {format(start, "dd MMM", { locale: fr })} → {format(end, "dd MMM yyyy", { locale: fr })}
              {" • "}{booking.totalDays} j
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Total / Caution</p>
          <p className="text-sm font-semibold">
            {formatGNF(booking.totalPrice)}{" "}
            <span className="text-muted-foreground font-normal">/ {formatGNF(booking.deposit)}</span>
          </p>
        </div>
        <Badge variant="outline" className={cn("gap-1", depMeta.className)}>
          <DepIcon className="w-3 h-3" />
          Caution : {depMeta.label}
          {depStatus === "partial" && booking.depositAmountWithheld != null && (
            <span className="ml-1">({formatGNF(booking.depositAmountWithheld)} retenus)</span>
          )}
        </Badge>
      </div>

      {depStatus === "withheld" && booking.depositWithheldReason && (
        <p className="text-xs text-destructive bg-destructive/5 rounded p-2">
          Motif : {booking.depositWithheldReason}
        </p>
      )}
      {depStatus === "partial" && booking.depositWithheldReason && (
        <p className="text-xs text-orange-700 dark:text-orange-400 bg-orange-500/5 rounded p-2">
          Motif : {booking.depositWithheldReason}
        </p>
      )}

      {/* Audit trail for completed bookings */}
      {booking.depositReturnAudits && booking.depositReturnAudits.length > 0 && (
        <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <History className="w-3.5 h-3.5" />
            Historique des retours de caution
          </div>
          <div className="space-y-2">
            {booking.depositReturnAudits.map((audit, idx) => {
              const auditDate = toDate(audit.processedAt);
              return (
                <div key={idx} className="text-xs space-y-1 border-l-2 pl-3 py-1" style={{ borderColor: audit.decision === "released" ? "#10b981" : audit.decision === "partial" ? "#f59e0b" : "#ef4444" }}>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium",
                      audit.decision === "released" && "text-emerald-600",
                      audit.decision === "partial" && "text-amber-600",
                      audit.decision === "withheld" && "text-red-600"
                    )}>
                      {audit.decision === "released" && "Caution restituée"}
                      {audit.decision === "partial" && "Caution partiellement retenue"}
                      {audit.decision === "withheld" && "Caution retenue"}
                    </span>
                    {auditDate && (
                      <span className="text-muted-foreground">
                        {format(auditDate, "dd/MM/yyyy HH:mm", { locale: fr })}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    Par {audit.processedByName || audit.processedBy.slice(0, 8)} • Total : {formatGNF(audit.depositTotal)} • Restitué : {formatGNF(audit.amountReleased)} • Retenu : {formatGNF(audit.amountWithheld)}
                  </p>
                  {audit.reason && (
                    <p className="text-muted-foreground italic">Motif : {audit.reason}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Show latest audit summary for active bookings */}
      {latestAudit && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 rounded p-2">
          <History className="w-3.5 h-3.5" />
          Dernière action : {latestAudit.decision === "released" ? "Restituée" : latestAudit.decision === "partial" ? "Partiellement retenue" : "Retenue"} le {latestAudit.processedAt && toDate(latestAudit.processedAt) ? format(toDate(latestAudit.processedAt)!, "dd/MM/yyyy HH:mm", { locale: fr }) : ""}
        </div>
      )}

      {canReturn && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => onReturn(booking)}>
            <ShieldCheck className="w-4 h-4 mr-2" /> Traiter le retour
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function LessorBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { bookings, loading } = useLessorRentalBookings(user?.uid);
  const [tab, setTab] = useState<"all" | "active" | "to_return" | "done">("all");
  const [selected, setSelected] = useState<RentalBooking | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    switch (tab) {
      case "active":
        return bookings.filter((b) => b.status === "confirmed" || b.status === "active");
      case "to_return":
        return bookings.filter(
          (b) => (b.status === "active" || b.status === "confirmed") && b.depositStatus === "held"
        );
      case "done":
        return bookings.filter((b) => b.status === "completed" || b.status === "cancelled");
      default:
        return bookings;
    }
  }, [bookings, tab]);

  const counts = useMemo(
    () => ({
      all: bookings.length,
      active: bookings.filter((b) => b.status === "confirmed" || b.status === "active").length,
      to_return: bookings.filter(
        (b) => (b.status === "active" || b.status === "confirmed") && b.depositStatus === "held"
      ).length,
      done: bookings.filter((b) => b.status === "completed" || b.status === "cancelled").length,
    }),
    [bookings]
  );

  const handleReturn = async (decision: DepositReturnDecision) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const ref = doc(db, "rental_bookings", selected.id);
      const base: Record<string, any> = {
        status: "completed" as BookingStatus,
        depositReleasedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (decision.kind === "released") {
        Object.assign(base, {
          depositStatus: "released" as DepositStatus,
          depositAmountReleased: selected.deposit,
          depositAmountWithheld: 0,
          depositWithheldReason: null,
        });
      } else {
        const withheld = Math.min(selected.deposit, Math.max(0, decision.amountWithheld));
        const released = Math.max(0, selected.deposit - withheld);
        Object.assign(base, {
          depositStatus: decision.kind as DepositStatus, // partial | withheld
          depositAmountWithheld: withheld,
          depositAmountReleased: released,
          depositWithheldReason: decision.reason,
        });
      }
      await updateDoc(ref, base);

      // Notify renter about the deposit decision
      try {
        const isReleased = decision.kind === "released";
        const withheld = isReleased
          ? 0
          : Math.min(selected.deposit, Math.max(0, decision.amountWithheld));
        const released = Math.max(0, selected.deposit - withheld);
        const title = isReleased
          ? "Caution restituée ✅"
          : decision.kind === "withheld"
          ? "Caution retenue intégralement"
          : "Caution partiellement retenue";
        const message = isReleased
          ? `Le retour de "${selected.itemTitle}" a été validé. Votre caution de ${formatGNF(selected.deposit)} sera restituée.`
          : `Sur "${selected.itemTitle}" : ${formatGNF(withheld)} retenus${
              released > 0 ? `, ${formatGNF(released)} restitués` : ""
            }. Motif : ${isReleased ? "" : decision.reason}`;

        await addDoc(collection(db, "notifications"), {
          userId: selected.renterId,
          type: isReleased ? "deposit_released" : "deposit_withheld",
          title,
          message,
          body: message,
          data: {
            bookingId: selected.id,
            itemId: selected.itemId,
            depositStatus: isReleased ? "released" : decision.kind,
            depositAmountWithheld: withheld,
            depositAmountReleased: released,
            ...(isReleased ? {} : { reason: decision.reason }),
          },
          read: false,
          createdAt: serverTimestamp(),
        });
      } catch (notifErr) {
        console.warn("[LessorBookings] notify renter failed", notifErr);
      }

      toast({
        title: "Retour enregistré",
        description:
          decision.kind === "released"
            ? "La caution a été marquée comme restituée. Le locataire a été notifié."
            : "La retenue de caution a été enregistrée. Le locataire a été notifié.",
      });
      setSelected(null);
    } catch (e: any) {
      console.error("[LessorBookings] return error", e);
      toast({
        title: "Erreur",
        description: e?.message || "Impossible d'enregistrer le retour.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Réservations — Loueur</h1>
            <p className="text-sm text-muted-foreground">
              Suivez les locations et confirmez le retour de caution.
            </p>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="all">Toutes ({counts.all})</TabsTrigger>
              <TabsTrigger value="active">En cours ({counts.active})</TabsTrigger>
              <TabsTrigger value="to_return">À retourner ({counts.to_return})</TabsTrigger>
              <TabsTrigger value="done">Terminées ({counts.done})</TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-4 space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
              ) : filtered.length === 0 ? (
                <Card className="p-8 text-center text-sm text-muted-foreground">
                  Aucune réservation dans cette catégorie.
                </Card>
              ) : (
                filtered.map((b) => (
                  <BookingRow key={b.id} booking={b} onReturn={(bk) => setSelected(bk)} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {selected && (
        <DepositReturnDialog
          open={!!selected}
          onOpenChange={(o) => !o && !submitting && setSelected(null)}
          deposit={selected.deposit}
          bookingRef={selected.id}
          loading={submitting}
          onConfirm={handleReturn}
        />
      )}
    </>
  );
}
