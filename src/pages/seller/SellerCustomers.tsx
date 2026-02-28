import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, UserCheck, RepeatIcon, TrendingUp, Search, Filter,
  ChevronDown, Star, ShoppingBag, Phone, Mail, MapPin, Calendar,
  Loader2, RefreshCw,
} from "lucide-react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { StatCard } from "@/components/seller/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useSellerCustomers, type SellerCustomer, type CustomerSegment } from "@/hooks/useSellerCustomers";

const segmentConfig: Record<string, { color: string; bg: string }> = {
  VIP: { color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
  Fidèle: { color: "text-primary", bg: "bg-primary/5 border-primary/20" },
  Nouveau: { color: "text-accent", bg: "bg-accent/5 border-accent/20" },
  "À risque": { color: "text-destructive", bg: "bg-destructive/5 border-destructive/20" },
};

const segments = ["Tous", "VIP", "Fidèle", "Nouveau", "À risque"];

function formatGNF(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M GNF`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K GNF`;
  return `${value.toLocaleString("fr-GN")} GNF`;
}

export default function SellerCustomers() {
  const { customers, stats, loading, error, seedDemoData } = useSellerCustomers();
  const [search, setSearch] = useState("");
  const [activeSegment, setActiveSegment] = useState("Tous");
  const [selectedCustomer, setSelectedCustomer] = useState<SellerCustomer | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Auto-seed demo data if collection is empty after load
  useEffect(() => {
    if (!loading && customers.length === 0 && !seeding) {
      setSeeding(true);
      seedDemoData().finally(() => setSeeding(false));
    }
  }, [loading, customers.length]);

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchSegment = activeSegment === "Tous" || c.segment === activeSegment;
    return matchSearch && matchSegment;
  });

  // Build chart data from real customers grouped by month
  const retentionData = (() => {
    const months: Record<string, { nouveaux: number; fideles: number; vip: number }> = {};
    customers.forEach((c) => {
      const d = c.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[key]) months[key] = { nouveaux: 0, fideles: 0, vip: 0 };
      if (c.segment === "VIP") months[key].vip++;
      else if (c.segment === "Fidèle") months[key].fideles++;
      else months[key].nouveaux++;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, vals]) => ({
        month: new Date(key + "-01").toLocaleDateString("fr-FR", { month: "short" }),
        ...vals,
      }));
  })();

  if (loading || seeding) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center h-64 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Chargement des clients...</span>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">Gérez votre base clients et fidélisez vos acheteurs</p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total clients" value={String(stats.total)} change={0} changeLabel="total" icon={Users} iconColor="primary" delay={0} />
          <StatCard title="Clients VIP" value={String(stats.vip)} change={0} changeLabel="segment" icon={Star} iconColor="accent" delay={0.1} />
          <StatCard title="Taux de rétention" value={`${stats.retentionRate}%`} change={0} changeLabel="clients récurrents" icon={RepeatIcon} iconColor="primary" delay={0.15} />
          <StatCard title="Valeur moy. client" value={formatGNF(stats.avgCustomerValue)} change={0} changeLabel="moyenne" icon={TrendingUp} iconColor="muted" delay={0.2} />
        </div>

        {/* Retention Chart + Segment Breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
            className="xl:col-span-2 bg-card rounded-xl border border-border shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-1">Évolution de la base clients</h3>
            <p className="text-sm text-muted-foreground mb-6">Répartition mensuelle par segment</p>
            <div className="h-56">
              {retentionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={retentionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="nouveaux" name="Nouveaux" stackId="a" fill="hsl(var(--accent))" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="fideles" name="Fidèles" stackId="a" fill="hsl(var(--primary))" />
                    <Bar dataKey="vip" name="VIP" stackId="a" fill="hsl(45 100% 51%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Pas encore de données pour le graphique
                </div>
              )}
            </div>
          </motion.div>

          {/* Segment Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4"
          >
            <h3 className="text-lg font-semibold text-foreground">Par segment</h3>
            {[
              { label: "VIP", count: stats.vip, pct: stats.total > 0 ? Math.round((stats.vip / stats.total) * 100) : 0, desc: "≥ 10 commandes" },
              { label: "Fidèle", count: stats.fidele, pct: stats.total > 0 ? Math.round((stats.fidele / stats.total) * 100) : 0, desc: "3–9 commandes" },
              { label: "Nouveau", count: stats.nouveau, pct: stats.total > 0 ? Math.round((stats.nouveau / stats.total) * 100) : 0, desc: "1–2 commandes" },
              { label: "À risque", count: stats.aRisque, pct: stats.total > 0 ? Math.round((stats.aRisque / stats.total) * 100) : 0, desc: "Inactif 60j+" },
            ].map((seg) => {
              const conf = segmentConfig[seg.label];
              return (
                <div key={seg.label} className={cn("rounded-lg border p-3", conf.bg)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-sm font-semibold", conf.color)}>{seg.label}</span>
                    <span className="text-sm font-bold text-foreground">{seg.count}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{seg.desc}</p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-current transition-all duration-500" style={{ width: `${seg.pct}%`, color: "inherit" }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right">{seg.pct}%</p>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Customer List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-card rounded-xl border border-border shadow-sm"
        >
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-6 border-b border-border">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {segments.map((seg) => (
                <Button
                  key={seg}
                  variant={activeSegment === seg ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setActiveSegment(seg)}
                >
                  {seg}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Client</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 hidden md:table-cell">Ville</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-6 py-3">Segment</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Commandes</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3 hidden lg:table-cell">Total dépensé</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3 hidden xl:table-cell">Dernière commande</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => {
                  const conf = segmentConfig[customer.segment];
                  return (
                    <tr
                      key={customer.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedCustomer(selectedCustomer?.id === customer.id ? null : customer)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary">
                              {customer.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {customer.city}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className={cn("text-xs border", conf.bg, conf.color)}>
                          {customer.segment}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground">{customer.orders}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right hidden lg:table-cell">
                        <span className="text-sm font-semibold text-primary">{customer.totalSpent.toLocaleString("fr-GN")} GNF</span>
                      </td>
                      <td className="px-6 py-4 text-right hidden xl:table-cell">
                        <div className="flex items-center justify-end gap-1 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-sm">
                            {customer.lastOrderAt ? customer.lastOrderAt.toLocaleDateString("fr-FR") : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-medium text-foreground">{customer.rating}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Aucun client trouvé</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Expanded Customer Detail */}
          {selectedCustomer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="border-t border-border bg-muted/30 p-6"
            >
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Coordonnées</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" /> {selectedCustomer.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" /> {selectedCustomer.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" /> {selectedCustomer.city}, {selectedCustomer.country}
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Historique d'achat</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground">Commandes</p>
                      <p className="text-xl font-bold text-foreground">{selectedCustomer.orders}</p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground">Total dépensé</p>
                      <p className="text-lg font-bold text-primary">{formatGNF(selectedCustomer.totalSpent)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:items-end justify-start">
                  <Button size="sm" className="gap-2 w-full sm:w-auto">
                    <Mail className="w-4 h-4" />
                    Contacter
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2 w-full sm:w-auto">
                    <ShoppingBag className="w-4 h-4" />
                    Voir commandes
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </SellerLayout>
  );
}
