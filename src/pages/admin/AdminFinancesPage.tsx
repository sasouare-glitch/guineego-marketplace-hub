/**
 * Admin Finances Page - Revenue breakdown by source
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Search, MoreHorizontal, Banknote, TrendingUp, ArrowUpRight,
  ArrowDownLeft, Clock, CheckCircle2, XCircle, RefreshCw, Download,
  Percent, Truck, Crown, Megaphone, GraduationCap, Globe,
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

// ── Revenue by source (monthly breakdown) ──
const revenueBySource = [
  { month: 'Août', commissions: 3200000, livraisons: 1800000, abonnements: 450000, sponsoring: 350000, transit: 800000, academy: 200000 },
  { month: 'Sep',  commissions: 3500000, livraisons: 1900000, abonnements: 600000, sponsoring: 400000, transit: 600000, academy: 200000 },
  { month: 'Oct',  commissions: 4200000, livraisons: 2100000, abonnements: 750000, sponsoring: 550000, transit: 1000000, academy: 300000 },
  { month: 'Nov',  commissions: 5100000, livraisons: 2400000, abonnements: 900000, sponsoring: 700000, transit: 1100000, academy: 300000 },
  { month: 'Déc',  commissions: 6800000, livraisons: 3200000, abonnements: 1050000, sponsoring: 850000, transit: 1800000, academy: 500000 },
  { month: 'Jan',  commissions: 5600000, livraisons: 2800000, abonnements: 1200000, sponsoring: 900000, transit: 900000, academy: 400000 },
];

const sourceConfig = {
  commissions:  { label: 'Commissions',  color: 'hsl(152 81% 39%)', icon: Percent,        textColor: 'text-primary' },
  livraisons:   { label: 'Livraisons',   color: 'hsl(210 80% 52%)', icon: Truck,          textColor: 'text-blue-600' },
  abonnements:  { label: 'Abonnements',  color: 'hsl(280 65% 55%)', icon: Crown,          textColor: 'text-purple-600' },
  sponsoring:   { label: 'Sponsoring',   color: 'hsl(38 96% 51%)',  icon: Megaphone,      textColor: 'text-accent' },
  transit:      { label: 'Transit',      color: 'hsl(190 70% 45%)', icon: Globe,          textColor: 'text-teal-600' },
  academy:      { label: 'Academy',      color: 'hsl(340 65% 55%)', icon: GraduationCap,  textColor: 'text-pink-600' },
} as const;

type SourceKey = keyof typeof sourceConfig;

// Compute current month totals
const currentMonth = revenueBySource[revenueBySource.length - 1];
const prevMonth = revenueBySource[revenueBySource.length - 2];
const sourceKeys: SourceKey[] = ['commissions', 'livraisons', 'abonnements', 'sponsoring', 'transit', 'academy'];
const totalCurrent = sourceKeys.reduce((s, k) => s + currentMonth[k], 0);
const totalPrev = sourceKeys.reduce((s, k) => s + prevMonth[k], 0);

// Pie chart data
const pieData = sourceKeys.map(k => ({
  name: sourceConfig[k].label,
  value: currentMonth[k],
  color: sourceConfig[k].color,
}));

// ── Transactions ──
const mockTransactions = [
  { id: 'TXN-0001', type: 'commission', label: 'Commission TechStore GN', amount: 45000, status: 'completed', date: '2024-01-20' },
  { id: 'TXN-0002', type: 'payout',     label: 'Paiement coursier Mamadou D.', amount: -22000, status: 'completed', date: '2024-01-20' },
  { id: 'TXN-0003', type: 'transit',    label: 'Fret TRN-001 Alpha Import', amount: 540000, status: 'completed', date: '2024-01-19' },
  { id: 'TXN-0004', type: 'payout',     label: 'Versement vendeur Mode Conakry', amount: -180000, status: 'pending', date: '2024-01-19' },
  { id: 'TXN-0005', type: 'commission', label: 'Commission BeautyGN', amount: 12500, status: 'completed', date: '2024-01-18' },
  { id: 'TXN-0006', type: 'academy',    label: 'Vente formation marketing', amount: 120000, status: 'completed', date: '2024-01-18' },
  { id: 'TXN-0007', type: 'payout',     label: 'Retrait investisseur Alpha B.', amount: -500000, status: 'failed', date: '2024-01-17' },
  { id: 'TXN-0008', type: 'sponsoring', label: 'Sponsoring produit iPhone 15', amount: 85000, status: 'completed', date: '2024-01-17' },
  { id: 'TXN-0009', type: 'abonnement', label: 'Abo Pro – Mode Conakry', amount: 150000, status: 'completed', date: '2024-01-16' },
  { id: 'TXN-0010', type: 'livraison',  label: 'Marge livraison CMD-3421', amount: 8500, status: 'completed', date: '2024-01-16' },
];

const typeConfig: Record<string, { label: string; color: string }> = {
  commission:  { label: 'Commission',   color: 'bg-primary/10 text-primary' },
  payout:      { label: 'Versement',    color: 'bg-orange-500/10 text-orange-700' },
  transit:     { label: 'Transit',      color: 'bg-teal-500/10 text-teal-700' },
  academy:     { label: 'Academy',      color: 'bg-pink-500/10 text-pink-700' },
  sponsoring:  { label: 'Sponsoring',   color: 'bg-accent/10 text-accent' },
  abonnement:  { label: 'Abonnement',   color: 'bg-purple-500/10 text-purple-700' },
  livraison:   { label: 'Livraison',    color: 'bg-blue-500/10 text-blue-700' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: React.ElementType }> = {
  completed: { label: 'Complété',   variant: 'default',      icon: CheckCircle2 },
  pending:   { label: 'En attente', variant: 'secondary',    icon: Clock },
  failed:    { label: 'Échoué',     variant: 'destructive',  icon: XCircle },
};

export default function AdminFinancesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { format } = useCurrency();

  const filtered = mockTransactions.filter(t => {
    const matchSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = activeTab === 'all' || t.type === activeTab || t.status === activeTab;
    return matchSearch && matchTab;
  });

  const totalRevenue = mockTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalPayout  = mockTransactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const pendingCount = mockTransactions.filter(t => t.status === 'pending').length;

  const growthPct = totalPrev > 0 ? ((totalCurrent - totalPrev) / totalPrev * 100).toFixed(1) : '0';

  return (
    <AdminLayout title="Finances" description="Revenus par source, versements et mouvements financiers">
      <div className="space-y-6">

        {/* ── Top KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground">Revenus ce mois</p>
              </div>
              <p className="text-2xl font-bold text-primary">{format(totalCurrent)}</p>
              <p className="text-xs text-primary/70 mt-1">+{growthPct}% vs mois précédent</p>
            </CardContent>
          </Card>
          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="w-5 h-5 text-orange-600" />
                <p className="text-sm text-muted-foreground">Versements</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">{format(totalPayout)}</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="w-5 h-5 text-green-600" />
                <p className="text-sm text-muted-foreground">Solde net</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{format(totalRevenue - totalPayout)}</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount} opérations</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Revenue by source cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {sourceKeys.map((key) => {
            const cfg = sourceConfig[key];
            const Icon = cfg.icon;
            const current = currentMonth[key];
            const prev = prevMonth[key];
            const change = prev > 0 ? ((current - prev) / prev * 100).toFixed(0) : '0';
            const pct = totalCurrent > 0 ? ((current / totalCurrent) * 100).toFixed(1) : '0';

            return (
              <Card key={key} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cfg.color.replace(')', ' / 0.12)')}` }}>
                      <Icon className={cn('w-4 h-4', cfg.textColor)} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{format(current)}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">{pct}% du total</span>
                    <span className={cn('text-[10px] font-medium', Number(change) >= 0 ? 'text-primary' : 'text-destructive')}>
                      {Number(change) >= 0 ? '+' : ''}{change}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stacked bar chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Revenus par source (6 mois)</CardTitle>
              <CardDescription>Ventilation mensuelle de toutes les sources de revenus</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueBySource} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [format(v), sourceConfig[name as SourceKey]?.label || name]}
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend formatter={(value) => sourceConfig[value as SourceKey]?.label || value} />
                  {sourceKeys.map((key) => (
                    <Bar key={key} dataKey={key} stackId="rev" fill={sourceConfig[key].color} radius={key === 'academy' ? [4, 4, 0, 0] : undefined} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Répartition ce mois</CardTitle>
              <CardDescription>Part de chaque source dans le revenu total</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => format(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground truncate">{d.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Revenue trend (area) ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendance des revenus totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueBySource.map(m => ({ month: m.month, total: sourceKeys.reduce((s, k) => s + m[k], 0) }))} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v: number) => format(v)} />
                <Area type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" fill="url(#finGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Transactions Table ── */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>Tous les mouvements financiers de la plateforme</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ID, libellé..."
                    className="pl-9 w-56"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList className="flex-wrap">
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="commission">Commissions</TabsTrigger>
                <TabsTrigger value="livraison">Livraisons</TabsTrigger>
                <TabsTrigger value="abonnement">Abonnements</TabsTrigger>
                <TabsTrigger value="sponsoring">Sponsoring</TabsTrigger>
                <TabsTrigger value="transit">Transit</TabsTrigger>
                <TabsTrigger value="academy">Academy</TabsTrigger>
                <TabsTrigger value="payout">Versements</TabsTrigger>
                <TabsTrigger value="pending">En attente</TabsTrigger>
              </TabsList>
            </Tabs>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => {
                  const type = typeConfig[t.type] || { label: t.type, color: 'bg-muted text-muted-foreground' };
                  const status = statusConfig[t.status];
                  const StatusIcon = status.icon;
                  const isCredit = t.amount > 0;
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm">{t.id}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${type.color}`}>
                          {type.label}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-56 truncate">{t.label}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1.5 font-semibold ${isCredit ? 'text-green-600' : 'text-orange-600'}`}>
                          {isCredit
                            ? <ArrowDownLeft className="w-3.5 h-3.5" />
                            : <ArrowUpRight className="w-3.5 h-3.5" />
                          }
                          {isCredit ? '+' : '-'}{format(Math.abs(t.amount))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(t.date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Voir détails</DropdownMenuItem>
                            <DropdownMenuItem>Générer reçu</DropdownMenuItem>
                            {t.status === 'pending' && (
                              <DropdownMenuItem>Valider manuellement</DropdownMenuItem>
                            )}
                            {t.status === 'pending' && (
                              <DropdownMenuItem className="text-destructive">
                                Annuler
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
