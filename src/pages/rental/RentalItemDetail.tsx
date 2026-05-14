import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvailabilityReason, findNextAvailableDates } from "@/lib/rental/availability";
import type { RentalItem } from "@/types/rental";

const formatGNF = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " GNF";

export default function RentalItemDetail() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const dateParam = params.get("date");

  const [item, setItem] = useState<RentalItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(
    dateParam ? new Date(dateParam) : undefined
  );
  const [pickerOpen, setPickerOpen] = useState(false);

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

  const alternatives = useMemo(
    () => (item && date && unavailable ? findNextAvailableDates(item, date, 12, 90) : []),
    [item, date, unavailable]
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
                    </div>
                  </div>
                )}

                <Button size="lg" className="w-full" disabled={unavailable}>
                  <CalendarDays className="w-4 h-4 mr-2" />
                  {unavailable ? "Indisponible à cette date" : "Réserver (bientôt)"}
                </Button>
                {!unavailable && (
                  <p className="text-xs text-muted-foreground text-center">
                    La réservation en ligne sera activée à l'étape suivante (calendrier +
                    paiement).
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
