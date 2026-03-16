/**
 * ADMIN STRIPE DASHBOARD: Track Stripe checkout sessions, conversion rates, and revenue
 */

import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminPayments, PaymentRecord } from "@/hooks/useAdminPayments";
import { CreditCard, TrendingUp, XCircle, CheckCircle, Clock, RefreshCw, ArrowUpRight, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))", "hsl(142 76% 36%)"];

export default function AdminStripeDashboardPage() {
  const { payments, loading } = useAdminPayments();
  const [period, setPeriod] = useState<"7" | "30" | "90">("30");

  // Filter only card (Stripe) payments
  const stripePayments = useMemo(() => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);
    return payments.filter(p => p.method === "card" && p.createdAt >= daysAgo);
  }, [payments, period]);

  const allStripe = useMemo(() => payments.filter(p => p.method === "card"), [payments]);

  // KPIs
  const kpis = useMemo(() => {
    const completed = stripePayments.filter(p => p.status === "completed");
    const failed = stripePayments.filter(p => p.status === "failed");
    const processing = stripePayments.filter(p => p.status === "processing");
    const refunded = stripePayments.filter(p => p.status === "refunded");
    const total = stripePayments.length;
    const conversionRate = total > 0 ? ((completed.length / total) * 100).toFixed(1) : "0";
    const revenue = completed.reduce((s, p) => s + p.amount, 0);
    const refundedAmount = refunded.reduce((s, p) => s + (p.refundAmount || p.amount), 0);
    const avgTicket = completed.length > 0 ? Math.round(revenue / completed.length) : 0;

    return {
      total,
      completed: completed.length,
      failed: failed.length,
      processing: processing.length,
      refunded: refunded.length,
      conversionRate,
      revenue,
      refundedAmount,
      avgTicket,
    };
  }, [stripePayments]);

  // Daily chart data
  const dailyData = useMemo(() => {
    const map: Record<string, { date: string; completed: number; failed: number; revenue: number }> = {};
    stripePayments.forEach(p => {
      const key = p.createdAt.toISOString().slice(0, 10);
      if (!map[key]) map[key] = { date: key, completed: 0, failed: 0, revenue: 0 };
      if (p.status === "completed") {
        map[key].completed++;
        map[key].revenue += p.amount;
      } else if (p.status === "failed") {
        map[key].failed++;
      }
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [stripePayments]);

  // Status distribution for pie
  const statusPie = useMemo(() => [
    { name: "Complétés", value: kpis.completed },
    { name: "Échoués", value: kpis.failed },
    { name: "En cours", value: kpis.processing },
    { name: "Remboursés", value: kpis.refunded },
  ].filter(d => d.value > 0), [kpis]);

  // Type distribution (subscription vs order)
  const typeDist = useMemo(() => {
    const subs = stripePayments.filter(p => p.type === "subscription").length;
    const orders = stripePayments.filter(p => p.type === "order").length;
    return [
      { name: "Commandes", value: orders },
      { name: "Abonnements", value: subs },
    ].filter(d => d.value > 0);
  }, [stripePayments]);

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      completed: { variant: "default", label: "Complété" },
      processing: { variant: "secondary", label: "En cours" },
      failed: { variant: "destructive", label: "Échoué" },
      refunded: { variant: "outline", label: "Remboursé" },
      pending: { variant: "secondary", label: "En attente" },
    };
    const s = map[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-primary" />
              Dashboard Stripe
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Suivi des sessions de paiement par carte bancaire
            </p>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sessions totales</p>
                  <p className="text-2xl font-bold text-foreground">{kpis.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taux de conversion</p>
                  <p className="text-2xl font-bold text-foreground">{kpis.conversionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenus carte</p>
                  <p className="text-2xl font-bold text-foreground">{kpis.revenue.toLocaleString()} GNF</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ticket moyen</p>
                  <p className="text-2xl font-bold text-foreground">{kpis.avgTicket.toLocaleString()} GNF</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-green-200 dark:border-green-900">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Complétés</p>
                <p className="text-lg font-semibold text-foreground">{kpis.completed}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/30">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <XCircle className="w-4 h-4 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Échoués</p>
                <p className="text-lg font-semibold text-foreground">{kpis.failed}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">En cours</p>
                <p className="text-lg font-semibold text-foreground">{kpis.processing}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Remboursés</p>
                <p className="text-lg font-semibold text-foreground">{kpis.refundedAmount.toLocaleString()} GNF</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="trend" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trend">Tendance</TabsTrigger>
            <TabsTrigger value="revenue">Revenus</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="trend">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sessions par jour</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="completed" name="Complétés" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="failed" name="Échoués" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Aucune session Stripe sur cette période</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenus par jour (GNF)</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => `${v.toLocaleString()} GNF`} />
                      <Area type="monotone" dataKey="revenue" name="Revenus" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Aucun revenu Stripe sur cette période</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Par statut</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusPie.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={statusPie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {statusPie.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">Aucune donnée</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Par type</CardTitle>
                </CardHeader>
                <CardContent>
                  {typeDist.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={typeDist} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {typeDist.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">Aucune donnée</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dernières sessions Stripe ({allStripe.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Stripe PI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allStripe.slice(0, 50).map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.reference}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {p.type === "subscription" ? "Abonnement" : "Commande"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{p.amount.toLocaleString()} GNF</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.createdAt.toLocaleDateString("fr-FR")} {p.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.stripePaymentIntentId ? p.stripePaymentIntentId.slice(0, 16) + "…" : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {allStripe.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun paiement Stripe enregistré
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
