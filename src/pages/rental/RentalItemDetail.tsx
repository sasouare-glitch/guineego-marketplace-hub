import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { DepositPaymentDialog, type DepositPaymentResult } from "@/components/rental/DepositPaymentDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { db } from "@/lib/firebase/config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ArrowLeft,
  MapPin,
  Shield,
  CalendarDays,
  CalendarIcon,
  CheckCircle2,
  Ban,
  X,
  CalendarCheck,
  Truck,
  Store,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvailabilityReason, findNextAvailableDates } from "@/lib/rental/availability";
import { computeRentalQuote, DEFAULT_DELIVERY_FEE, type RentalMode } from "@/lib/rental/pricing";
import type { RentalItem } from "@/types/rental";

const formatGNF = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " GNF";

export default function RentalItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const dateParam = params.get("date");

  const [depositOpen, setDepositOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [item, setItem] = useState<RentalItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(
    dateParam ? new Date(dateParam) : undefined
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [mode, setMode] = useState<RentalMode>("pickup");
  const [altPage, setAltPage] = useState(1);

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
    return () => {
      cancelled = true;
    };
  }, [id]);

  const updateDate = (d: Date | undefined) => {
    setDate(d);
    const next = new URLSearchParams(params);
    if (d) next.set("date", format(d, "yyyy-MM-dd"));
    else next.delete("date");
    setParams(next, { replace: true });
    setPickerOpen(false);
  };

  const reason = useMemo(
    () => (item && date ? getAvailabilityReason(item, date) : null),
    [item, date]
  );
  const unavailable = !!reason;

  const ALT_PAGE_SIZE = 12;
  const ALT_MAX = 60;
  const ALT_LOOKAHEAD = 365;
  const altLimit = Math.min(altPage * ALT_PAGE_SIZE, ALT_MAX);

  const alternatives = useMemo(
    () =>
      item && date && unavailable
        ? findNextAvailableDates(item, date, altLimit, ALT_LOOKAHEAD)
        : [],
    [item, date, unavailable, altLimit]
  );

  // Probe next page to know if more exist
  const hasMore = useMemo(() => {
    if (!item || !date || !unavailable) return false;
    if (altLimit >= ALT_MAX) return false;
    return (
      findNextAvailableDates(item, date, altLimit + 1, ALT_LOOKAHEAD).length >
      alternatives.length
    );
  }, [item, date, unavailable, altLimit, alternatives.length]);

  // Reset pagination when date or item changes
  useEffect(() => {
    setAltPage(1);
  }, [date, item?.id]);

  // Reset endDate when start changes / becomes invalid
  useEffect(() => {
    if (!date) setEndDate(undefined);
    else if (endDate && endDate < date) setEndDate(undefined);
  }, [date]);

  const quote = useMemo(
    () =>
      computeRentalQuote({
        startDate: date ?? null,
        endDate: endDate ?? null,
        pricePerDay: item?.pricePerDay ?? 0,
        deposit: item?.deposit ?? 0,
        minDays: item?.minDays ?? 1,
        mode,
        deliveryFee: DEFAULT_DELIVERY_FEE,
      }),
    [date, endDate, item?.pricePerDay, item?.deposit, item?.minDays, mode]
  );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Link
            to="/rental"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
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
            <div className="text-center py-16 text-muted-foreground">
              Équipement introuvable.
            </div>
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
                    {formatGNF(item.pricePerDay)}
                    <span className="text-sm text-muted-foreground"> / jour</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Shield className="w-4 h-4" /> Caution : {formatGNF(item.deposit)}
                  </p>
                </div>

                {/* Vérification de disponibilité */}
                <div className="bg-card border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Vérifier la disponibilité</p>
                    {date && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateDate(undefined)}
                      >
                        <X className="w-3 h-3 mr-1" /> Effacer
                      </Button>
                    )}
                  </div>

                  <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {date
                          ? format(date, "EEEE d MMMM yyyy", { locale: fr })
                          : "Choisir une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={updateDate}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>

                  {date && (
                    <div
                      role="status"
                      className={cn(
                        "rounded-lg px-3 py-2.5 text-sm flex items-start gap-2",
                        unavailable
                          ? "bg-destructive/10 text-destructive border border-destructive/30"
                          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                      )}
                    >
                      {unavailable ? (
                        <>
                          <Ban className="w-4 h-4 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">
                              Indisponible le{" "}
                              {format(date, "d MMMM yyyy", { locale: fr })}
                            </p>
                            <p className="text-xs opacity-90">{reason}</p>
                            {alternatives.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-destructive/20">
                                <p className="text-xs font-medium mb-1.5">
                                  Prochaines dates disponibles :
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {alternatives.map((alt) => (
                                    <button
                                      key={alt.toISOString()}
                                      type="button"
                                      onClick={() => updateDate(alt)}
                                      className="text-xs px-2 py-1 rounded-md bg-background hover:bg-accent text-foreground border border-border transition-colors"
                                    >
                                      {format(alt, "EEE d MMM", { locale: fr })}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">
                              Disponible le{" "}
                              {format(date, "d MMMM yyyy", { locale: fr })}
                            </p>
                            <p className="text-xs opacity-90">
                              Vous pouvez réserver cet équipement à cette date.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-foreground/80 whitespace-pre-line">{item.description}</p>

                {unavailable && alternatives.length > 0 && (
                  <div className="space-y-3 rounded-xl border border-border bg-card p-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => updateDate(alternatives[0])}
                    >
                      <CalendarCheck className="w-4 h-4 mr-2" />
                      Passer au {format(alternatives[0], "EEE d MMM", { locale: fr })}
                    </Button>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Ou choisissez une autre date disponible :
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {alternatives.map((alt) => {
                          const key = format(alt, "yyyy-MM-dd");
                          const selectedKey = date ? format(date, "yyyy-MM-dd") : "";
                          const isSelected = key === selectedKey;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => updateDate(alt)}
                              className={cn(
                                "text-xs px-2.5 py-1.5 rounded-md border transition-colors",
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background hover:bg-accent text-foreground border-border"
                              )}
                            >
                              {format(alt, "EEE d MMM", { locale: fr })}
                            </button>
                          );
                        })}
                      </div>
                      {(hasMore || altPage > 1) && (
                        <div className="mt-2 flex items-center gap-2">
                          {hasMore && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setAltPage((p) => p + 1)}
                            >
                              Voir plus
                            </Button>
                          )}
                          {altPage > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-muted-foreground"
                              onClick={() => setAltPage(1)}
                            >
                              Réduire
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Récapitulatif tarifaire */}
                {date && !unavailable && (
                  <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-primary" />
                      <p className="text-sm font-semibold">Récapitulatif tarifaire</p>
                    </div>

                    {/* Date de fin */}
                    {(() => {
                      const minDays = Math.max(1, item.minDays ?? 1);
                      const minEnd = date
                        ? new Date(date.getTime() + (minDays - 1) * 86400000)
                        : null;
                      const endInvalid =
                        !!date && !!endDate && endDate < (minEnd ?? date);
                      return (
                        <div className="space-y-1.5">
                          <p className="text-xs text-muted-foreground">
                            Date de fin (optionnelle)
                          </p>
                          <Popover open={endPickerOpen} onOpenChange={setEndPickerOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "w-full justify-start",
                                  endInvalid && "border-destructive text-destructive"
                                )}
                              >
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                {endDate
                                  ? format(endDate, "EEE d MMM yyyy", { locale: fr })
                                  : `Même jour (${minDays} jour${minDays > 1 ? "s" : ""} min.)`}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={(d) => {
                                  setEndDate(d);
                                  setEndPickerOpen(false);
                                }}
                                disabled={(d) => !minEnd || d < minEnd}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          {endInvalid && (
                            <p
                              role="alert"
                              className="text-xs text-destructive flex items-start gap-1"
                            >
                              <Ban className="w-3 h-3 mt-0.5 shrink-0" />
                              Durée minimale de {minDays} jour{minDays > 1 ? "s" : ""} requise.
                              La fin doit être au plus tôt le{" "}
                              {minEnd ? format(minEnd, "d MMM yyyy", { locale: fr }) : ""}.
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Mode : retrait ou livraison */}
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Récupération</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setMode("pickup")}
                          className={cn(
                            "rounded-lg border p-2.5 text-left transition-colors",
                            mode === "pickup"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-accent"
                          )}
                        >
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Store className="w-4 h-4" /> Retrait
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Gratuit · sur place
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMode("delivery")}
                          className={cn(
                            "rounded-lg border p-2.5 text-left transition-colors",
                            mode === "delivery"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-accent"
                          )}
                        >
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Truck className="w-4 h-4" /> Livraison
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatGNF(DEFAULT_DELIVERY_FEE)}
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Détail du calcul */}
                    <div className="space-y-1.5 text-sm border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {formatGNF(item.pricePerDay)} × {quote.days} jour
                          {quote.days > 1 ? "s" : ""}
                        </span>
                        <span className="font-medium">{formatGNF(quote.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          {mode === "delivery" ? (
                            <><Truck className="w-3.5 h-3.5" /> Livraison</>
                          ) : (
                            <><Store className="w-3.5 h-3.5" /> Retrait</>
                          )}
                        </span>
                        <span className="font-medium">
                          {quote.deliveryFee > 0 ? formatGNF(quote.deliveryFee) : "Gratuit"}
                        </span>
                      </div>
                      {quote.deposit > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" /> Caution (remboursable)
                          </span>
                          <span className="font-medium">{formatGNF(quote.deposit)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2 mt-1">
                        <span className="font-semibold">Total à régler</span>
                        <span className="font-bold text-primary text-lg">
                          {formatGNF(quote.totalPayable)}
                        </span>
                      </div>
                      {quote.deposit > 0 && (
                        <p className="text-[11px] text-muted-foreground text-right">
                          Dont {formatGNF(quote.deposit)} restitués au retour
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full"
                  disabled={unavailable || !date || creating}
                  onClick={() => {
                    if (!user) {
                      toast.info("Connectez-vous pour réserver");
                      navigate(`/login?redirect=/rental/item/${item.id}`);
                      return;
                    }
                    setDepositOpen(true);
                  }}
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  {unavailable
                    ? "Indisponible à cette date"
                    : !date
                    ? "Choisissez une date"
                    : quote.deposit > 0
                    ? `Réserver et régler la caution (${formatGNF(quote.deposit)})`
                    : "Réserver"}
                </Button>
                {!unavailable && date && (
                  <p className="text-xs text-muted-foreground text-center">
                    La caution est bloquée jusqu'au retour, puis restituée si l'équipement
                    est rendu en bon état.
                  </p>
                )}

                <DepositPaymentDialog
                  open={depositOpen}
                  onOpenChange={setDepositOpen}
                  amount={quote.deposit}
                  bookingRef={`${item.id}-${date ? format(date, "yyyyMMdd") : "na"}`}
                  onPaid={async (res) => {
                    if (!user || !date) return;
                    setCreating(true);
                    try {
                      const startD = date;
                      const endD = endDate ?? date;
                      const docRef = await addDoc(collection(db, "rental_bookings"), {
                        itemId: item.id,
                        itemTitle: item.title,
                        itemThumbnail: item.thumbnail || item.images?.[0] || "",
                        ownerId: item.ownerId,
                        renterId: user.uid,
                        renterName: user.displayName || "",
                        startDate: startD,
                        endDate: endD,
                        totalDays: quote.days,
                        pricePerDay: item.pricePerDay,
                        totalPrice: quote.totalRentalCost,
                        deliveryFee: quote.deliveryFee,
                        mode,
                        deposit: quote.deposit,
                        status: "pending",
                        paymentStatus: "pending",
                        // Caution
                        depositStatus: "held",
                        depositPaymentMethod: res.method,
                        depositTransactionId: res.transactionId,
                        depositPaidAt: serverTimestamp(),
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                      });
                      toast.success("Réservation enregistrée");
                      navigate(`/my-rentals?highlight=${docRef.id}`);
                    } catch (e: any) {
                      console.error("[booking create]", e);
                      toast.error("Échec de la réservation", {
                        description: e?.message ?? "Réessayez.",
                      });
                    } finally {
                      setCreating(false);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
