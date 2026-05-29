import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, MapPin, Sparkles, CalendarIcon, X, CheckCircle2, Ban, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RENTAL_CATEGORIES } from "@/constants/rentalCategories";
import { useRentalItems } from "@/hooks/useRentalItems";
import { getAvailabilityReason } from "@/lib/rental/availability";
import type { RentalCategoryId } from "@/types/rental";

type SortKey = "recent" | "price_asc" | "price_desc";

const formatGNF = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n) + " GNF";

export default function RentalMarketplace() {
  const [params, setParams] = useSearchParams();
  const categoryParam = params.get("category") as RentalCategoryId | null;
  const dateParam = params.get("date");

  const [date, setDate] = useState<Date | undefined>(
    dateParam ? new Date(dateParam) : undefined
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [commune, setCommune] = useState<string>(params.get("commune") ?? "");
  const [sort, setSort] = useState<SortKey>((params.get("sort") as SortKey) || "recent");

  const { items, loading } = useRentalItems({
    max: 48,
    ...(categoryParam ? { category: categoryParam } : {}),
  });

  const communes = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.location?.commune && s.add(i.location.commune));
    return Array.from(s).sort();
  }, [items]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items.filter((i) => i.status !== "inactive");
    if (q.length >= 2) {
      list = list.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }
    if (commune) list = list.filter((i) => i.location?.commune === commune);
    if (sort === "price_asc") list = [...list].sort((a, b) => a.pricePerDay - b.pricePerDay);
    else if (sort === "price_desc") list = [...list].sort((a, b) => b.pricePerDay - a.pricePerDay);
    return list;
  }, [items, search, commune, sort]);

  const availableCount = useMemo(() => {
    if (!date) return visible.length;
    return visible.filter((i) => getAvailabilityReason(i, date) === null).length;
  }, [visible, date]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const setDateFilter = (d: Date | undefined) => {
    setDate(d);
    const next = new URLSearchParams(params);
    if (d) next.set("date", format(d, "yyyy-MM-dd"));
    else next.delete("date");
    setParams(next, { replace: true });
    setPickerOpen(false);
  };

  const setCategory = (cat: RentalCategoryId | null) => {
    const next = new URLSearchParams(params);
    if (cat) next.set("category", cat);
    else next.delete("category");
    setParams(next, { replace: true });
  };

  const activeCategory = RENTAL_CATEGORIES.find((c) => c.id === categoryParam);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-20 lg:pt-32">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b">
          <div className="container mx-auto px-4 py-10">
            <Badge variant="secondary" className="mb-3">
              <Sparkles className="w-3 h-3 mr-1" /> Nouveau
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Louez voitures & équipements
            </h1>
            <p className="text-muted-foreground max-w-2xl mb-6">
              Trouvez véhicules, engins de chantier, outillage et matériel événementiel
              partout en Guinée. Ou mettez vos propres équipements en location.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/lessor/items/new">Mettre un équipement en location</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/marketplace">Aller à la boutique</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Catégories */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold mb-4">Catégories</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {RENTAL_CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isActive = c.id === categoryParam;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(isActive ? null : (c.id as RentalCategoryId))}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors text-left",
                    isActive
                      ? "border-primary bg-accent/40"
                      : "border-border hover:border-primary hover:bg-accent/30"
                  )}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-center font-medium">{c.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Filtres */}
        <section className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/50 p-3">
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
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
                  onSelect={setDateFilter}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {date && (
              <Button variant="ghost" size="sm" onClick={() => setDateFilter(undefined)}>
                <X className="w-3 h-3 mr-1" /> Réinitialiser la date
              </Button>
            )}

            {activeCategory && (
              <Badge variant="secondary" className="gap-1">
                {activeCategory.label}
                <button
                  type="button"
                  onClick={() => setCategory(null)}
                  aria-label="Retirer le filtre catégorie"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            <span className="ml-auto text-xs text-muted-foreground">
              {loading
                ? "…"
                : date
                ? `${availableCount} disponible${availableCount > 1 ? "s" : ""} sur ${visible.length}`
                : `${visible.length} équipement${visible.length > 1 ? "s" : ""}`}
            </span>
          </div>
        </section>

        {/* Liste items */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold mb-4">
            {date
              ? `Disponibles le ${format(date, "d MMMM", { locale: fr })}`
              : "Disponibles à la location"}
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="mb-2">Aucun équipement en location pour le moment.</p>
              <p className="text-sm">
                Soyez le premier !{" "}
                <Link to="/lessor/items/new" className="text-primary underline">
                  Ajouter un équipement
                </Link>
              </p>
            </div>
          ) : (
            <TooltipProvider delayDuration={150}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {visible.map((item) => {
                  const reason = date ? getAvailabilityReason(item, date) : null;
                  const unavailable = !!reason;
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <Link to={`/rental/item/${item.id}`} className="block">
                          <Card
                            className={cn(
                              "overflow-hidden hover:shadow-lg transition-shadow relative",
                              unavailable && "opacity-60"
                            )}
                          >
                            <div className="absolute top-2 left-2 z-10">
                              {unavailable ? (
                                <Badge variant="destructive" className="gap-1 shadow-sm">
                                  <Ban className="w-3 h-3" /> Indisponible
                                </Badge>
                              ) : date ? (
                                <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600 text-white shadow-sm">
                                  <CheckCircle2 className="w-3 h-3" /> Disponible
                                </Badge>
                              ) : null}
                            </div>
                            <div className="aspect-square bg-muted overflow-hidden">
                              <img
                                src={item.thumbnail || item.images?.[0] || "/placeholder.svg"}
                                alt={item.title}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-3 space-y-1">
                              <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                              <p className="text-primary font-semibold text-sm">
                                {formatGNF(item.pricePerDay)}
                                <span className="text-xs text-muted-foreground">/jour</span>
                              </p>
                              {item.location?.commune && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {item.location.commune}
                                </p>
                              )}
                            </div>
                          </Card>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {date
                          ? unavailable
                            ? `Indisponible le ${format(date, "d MMM", { locale: fr })} — ${reason}`
                            : `Disponible le ${format(date, "d MMM yyyy", { locale: fr })}`
                          : "Sélectionnez une date pour vérifier la disponibilité"}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
