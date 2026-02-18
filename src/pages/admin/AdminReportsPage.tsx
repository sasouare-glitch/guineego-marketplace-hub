/**
 * Admin Reports Page - Exports comptables et rapports périodiques
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  FileText, Download, Calendar, TrendingUp, Package,
  Truck, GraduationCap, Globe, Store, CheckCircle2,
  FileSpreadsheet, FileBarChart, RefreshCw, Filter,
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const monthlyComparison = [
  { mois: 'Oct', commissions: 3200000, transit: 8900000, academy: 450000, livraisons: 1200000 },
  { mois: 'Nov', commissions: 4100000, transit: 11200000, academy: 620000, livraisons: 1580000 },
  { mois: 'Déc', commissions: 6300000, transit: 15400000, academy: 890000, livraisons: 2100000 },
  { mois: 'Jan', commissions: 4800000, transit: 12800000, academy: 710000, livraisons: 1850000 },
  { mois: 'Fév', commissions: 5200000, transit: 13600000, academy: 780000, livraisons: 1920000 },
  { mois: 'Mar', commissions: 5900000, transit: 14200000, academy: 840000, livraisons: 2050000 },
];

const recentReports = [
  { id: 'RPT-2024-03', name: 'Rapport mensuel — Mars 2024', type: 'mensuel', date: '2024-03-31', size: '2.4 MB', status: 'ready' },
  { id: 'RPT-2024-02', name: 'Rapport mensuel — Février 2024', type: 'mensuel', date: '2024-02-29', size: '2.1 MB', status: 'ready' },
  { id: 'RPT-2024-Q1', name: 'Rapport trimestriel — T1 2024', type: 'trimestriel', date: '2024-03-31', size: '5.8 MB', status: 'ready' },
  { id: 'RPT-2024-01', name: 'Rapport mensuel — Janvier 2024', type: 'mensuel', date: '2024-01-31', size: '1.9 MB', status: 'ready' },
  { id: 'RPT-2023-12', name: 'Rapport mensuel — Décembre 2023', type: 'mensuel', date: '2023-12-31', size: '3.2 MB', status: 'ready' },
  { id: 'RPT-2023-Q4', name: 'Rapport trimestriel — T4 2023', type: 'trimestriel', date: '2023-12-31', size: '6.1 MB', status: 'ready' },
];

const categoryBreakdown = [
  { category: 'Commissions marketplace', icon: Store, amount: 30500000, pct: 38, trend: +12 },
  { category: 'Transit Chine-Guinée', icon: Globe, amount: 76100000, pct: 95, trend: +18 },
  { category: 'Paiements livreurs', icon: Truck, amount: 9700000, pct: 12, trend: +5 },
  { category: 'Formations Academy', icon: GraduationCap, amount: 4290000, pct: 6, trend: +31 },
  { category: 'Frais plateforme', icon: Package, amount: 2100000, pct: 3, trend: -2 },
];

const exportTemplates = [
  {
    id: 'transactions-csv',
    title: 'Transactions (CSV)',
    description: 'Tous les mouvements financiers au format tableur',
    icon: FileSpreadsheet,
    format: 'CSV',
    color: 'text-green-600',
    bg: 'bg-green-500/10',
  },
  {
    id: 'orders-csv',
    title: 'Commandes (CSV)',
    description: 'Historique complet des commandes avec statuts',
    icon: FileSpreadsheet,
    format: 'CSV',
    color: 'text-green-600',
    bg: 'bg-green-500/10',
  },
  {
    id: 'sellers-pdf',
    title: 'Rapport Vendeurs (PDF)',
    description: 'Performance par vendeur avec CA et commissions',
    icon: FileBarChart,
    format: 'PDF',
    color: 'text-red-600',
    bg: 'bg-red-500/10',
  },
  {
    id: 'couriers-pdf',
    title: 'Rapport Livreurs (PDF)',
    description: 'Missions, gains et taux de complétion par coursier',
    icon: FileBarChart,
    format: 'PDF',
    color: 'text-red-600',
    bg: 'bg-red-500/10',
  },
  {
    id: 'transit-csv',
    title: 'Expéditions Transit (CSV)',
    description: 'Toutes les expéditions Chine-Guinée avec coûts',
    icon: FileSpreadsheet,
    format: 'CSV',
    color: 'text-green-600',
    bg: 'bg-green-500/10',
  },
  {
    id: 'academy-pdf',
    title: 'Rapport Academy (PDF)',
    description: 'Inscriptions, taux de complétion et revenus',
    icon: FileBarChart,
    format: 'PDF',
    color: 'text-red-600',
    bg: 'bg-red-500/10',
  },
];

const typeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  mensuel:      { label: 'Mensuel',      variant: 'secondary' },
  trimestriel:  { label: 'Trimestriel', variant: 'default' },
  annuel:       { label: 'Annuel',       variant: 'outline' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const { format } = useCurrency();
  const [period, setPeriod] = useState('6m');
  const [generating, setGenerating] = useState<string | null>(null);

  const handleExport = (id: string) => {
    setGenerating(id);
    setTimeout(() => setGenerating(null), 1800);
  };

  const totalRevenue = categoryBreakdown.reduce((s, c) => s + c.amount, 0);

  return (
    <AdminLayout title="Rapports" description="Exports comptables et synthèses périodiques">
      <div className="space-y-6">

        {/* Header actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Ce mois</SelectItem>
                <SelectItem value="3m">3 derniers mois</SelectItem>
                <SelectItem value="6m">6 derniers mois</SelectItem>
                <SelectItem value="1y">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <Button className="gap-2">
            <FileText className="w-4 h-4" />
            Générer rapport complet
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Revenus totaux</p>
              <p className="text-xl font-bold text-primary">{format(totalRevenue)}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +15% vs période préc.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Commandes traitées</p>
              <p className="text-xl font-bold">1 284</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +8% vs période préc.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Livreurs actifs</p>
              <p className="text-xl font-bold">47</p>
              <p className="text-xs text-muted-foreground mt-1">Taux complétion 91%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Rapports générés</p>
              <p className="text-xl font-bold">{recentReports.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Archivés disponibles</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="synthesis" className="space-y-4">
          <TabsList>
            <TabsTrigger value="synthesis">Synthèse</TabsTrigger>
            <TabsTrigger value="exports">Exports</TabsTrigger>
            <TabsTrigger value="archives">Archives</TabsTrigger>
          </TabsList>

          {/* ── TAB: Synthèse ── */}
          <TabsContent value="synthesis" className="space-y-6">

            {/* Revenue by category */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des revenus par source</CardTitle>
                <CardDescription>Contributions relatives de chaque flux de revenus</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {categoryBreakdown.map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-medium ${item.trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {item.trend >= 0 ? '+' : ''}{item.trend}%
                          </span>
                          <span className="text-muted-foreground w-28 text-right">{format(item.amount)}</span>
                        </div>
                      </div>
                      <Progress value={item.pct} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Monthly Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution mensuelle par source de revenus</CardTitle>
                <CardDescription>Comparaison des 6 derniers mois</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyComparison} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="mois" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(v: number) => format(v)} />
                    <Legend />
                    <Bar dataKey="commissions" name="Commissions" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="transit" name="Transit" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="academy" name="Academy" fill="hsl(var(--chart-3))" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="livraisons" name="Livraisons" fill="hsl(var(--chart-4))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB: Exports ── */}
          <TabsContent value="exports">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exportTemplates.map(tpl => {
                const Icon = tpl.icon;
                const isLoading = generating === tpl.id;
                return (
                  <Card key={tpl.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2.5 rounded-lg ${tpl.bg}`}>
                          <Icon className={`w-5 h-5 ${tpl.color}`} />
                        </div>
                        <Badge variant="outline" className="text-xs">{tpl.format}</Badge>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{tpl.title}</h3>
                      <p className="text-xs text-muted-foreground mb-4">{tpl.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => handleExport(tpl.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        {isLoading ? 'Génération...' : 'Télécharger'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ── TAB: Archives ── */}
          <TabsContent value="archives">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Rapports archivés</CardTitle>
                    <CardDescription>Historique des rapports générés automatiquement</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-3.5 h-3.5" />
                    Filtrer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rapport</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentReports.map(report => {
                      const type = typeConfig[report.type] ?? { label: report.type, variant: 'outline' as const };
                      return (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="font-medium text-sm">{report.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{report.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={type.variant} className="text-xs">{type.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(report.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{report.size}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-green-600 text-sm">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Disponible
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="gap-1.5 h-8">
                              <Download className="w-3.5 h-3.5" />
                              PDF
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
