import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, Eye, ShoppingBag, Star, Package, MousePointerClick, ArrowUpRight, Loader2,
} from "lucide-react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { StatCard } from "@/components/seller/StatCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSellerAnalytics } from "@/hooks/useSellerAnalytics";
import { useCurrency } from "@/hooks/useCurrency";

const periods = [
  { label: "7 jours", value: 7 },
  { label: "30 jours", value: 30 },
  { label: "90 jours", value: 90 },
];

const formatGNF = (v: number) => {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return v.toString();
};

export default function SellerAnalytics() {
  const [periodDays, setPeriodDays] = useState(7);
  const { analytics, loading } = useSellerAnalytics(periodDays);
  const { format: formatPrice } = useCurrency();

  if (loading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SellerLayout>
    );
  }

  const { totalRevenue, totalOrders, estimatedVisitors, conversionRate, chartData, categoryData, topProducts, funnel } = analytics;

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Statistiques</h1>
              <p className="text-muted-foreground">Analysez les performances de votre boutique</p>
            </div>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              {periods.map((p) => (
                <Button
                  key={p.value}
                  variant="ghost"
                  size="sm"
                  className={cn("text-xs", periodDays === p.value && "bg-background shadow-sm")}
                  onClick={() => setPeriodDays(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Chiffre d'affaires" value={formatPrice(totalRevenue)} icon={TrendingUp} iconColor="primary" delay={0} />
          <StatCard title="Commandes" value={totalOrders.toString()} icon={ShoppingBag} iconColor="accent" delay={0.1} />
          <StatCard title="Visiteurs estimés" value={estimatedVisitors.toLocaleString("fr-FR")} icon={Eye} iconColor="muted" delay={0.15} />
          <StatCard title="Taux de conversion" value={`${conversionRate.toFixed(1)}%`} icon={MousePointerClick} iconColor="primary" delay={0.2} />
        </div>

        {/* Revenue Chart + Category Pie */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
            className="xl:col-span-2 bg-card rounded-xl border border-border shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-1">Évolution du chiffre d'affaires</h3>
            <p className="text-sm text-muted-foreground mb-6">CA et nombre de commandes sur la période</p>
            <div className="h-64">
              {chartData.every(d => d.ca === 0) ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Aucune vente sur cette période</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                    <YAxis tickFormatter={formatGNF} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      formatter={(value: number, name: string) => [
                        name === "ca" ? `${value.toLocaleString("fr-GN")} GNF` : value,
                        name === "ca" ? "CA" : "Commandes",
                      ]}
                    />
                    <Area type="monotone" dataKey="ca" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorCA)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-card rounded-xl border border-border shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-1">Par catégorie</h3>
            <p className="text-sm text-muted-foreground mb-4">Répartition des ventes</p>
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Aucune donnée</div>
            ) : (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {categoryData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v}%`, "Part"]} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-muted-foreground">{cat.name}</span>
                      </div>
                      <span className="font-medium text-foreground">{cat.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Funnel */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}
            className="bg-card rounded-xl border border-border shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-1">Commandes par période</h3>
            <p className="text-sm text-muted-foreground mb-6">Nombre de commandes</p>
            <div className="h-52">
              {chartData.every(d => d.commandes === 0) ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Aucune commande</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: number) => [v, "Commandes"]} />
                    <Bar dataKey="commandes" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
            className="bg-card rounded-xl border border-border shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-1">Entonnoir de conversion</h3>
            <p className="text-sm text-muted-foreground mb-6">Du visiteur à l'acheteur</p>
            <div className="space-y-3">
              {funnel.map((step, i) => (
                <div key={step.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">{step.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">{step.value.toLocaleString("fr-FR")}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">{step.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${step.pct}%`,
                        backgroundColor: i === 4 ? "hsl(var(--primary))" : "hsl(var(--accent))",
                        opacity: 1 - i * 0.1,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Top Products Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }}
          className="bg-card rounded-xl border border-border shadow-sm"
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Top Produits</h3>
              <p className="text-sm text-muted-foreground">Meilleures performances sur la période</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href="/seller/products">
                <ArrowUpRight className="w-4 h-4" />
                Voir tout
              </a>
            </Button>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Aucun produit trouvé</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">#</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Produit</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Ventes</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">CA</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Stock</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-foreground">{p.ventes}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-primary">{formatPrice(p.ca)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn("text-sm font-medium", p.stock <= 5 ? "text-destructive" : "text-foreground")}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-medium text-foreground">{p.note.toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </SellerLayout>
  );
}
