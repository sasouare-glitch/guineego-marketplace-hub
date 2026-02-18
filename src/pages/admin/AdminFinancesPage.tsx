/**
 * Admin Finances Page - Revenue, Payouts and Wallet Management
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
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Search, MoreHorizontal, Banknote, TrendingUp, ArrowUpRight,
  ArrowDownLeft, Clock, CheckCircle2, XCircle, RefreshCw, Download,
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

const revenueHistory = [
  { month: 'Août', revenus: 6800000 },
  { month: 'Sep',  revenus: 7200000 },
  { month: 'Oct',  revenus: 8900000 },
  { month: 'Nov',  revenus: 10500000 },
  { month: 'Déc',  revenus: 14200000 },
  { month: 'Jan',  revenus: 11800000 },
];

const mockTransactions = [
  { id: 'TXN-0001', type: 'commission', label: 'Commission TechStore GN', amount: 45000, status: 'completed', date: '2024-01-20' },
  { id: 'TXN-0002', type: 'payout',     label: 'Paiement coursier Mamadou D.', amount: -22000, status: 'completed', date: '2024-01-20' },
  { id: 'TXN-0003', type: 'transit',    label: 'Fret TRN-001 Alpha Import', amount: 540000, status: 'completed', date: '2024-01-19' },
  { id: 'TXN-0004', type: 'payout',     label: 'Versement vendeur Mode Conakry', amount: -180000, status: 'pending', date: '2024-01-19' },
  { id: 'TXN-0005', type: 'commission', label: 'Commission BeautyGN', amount: 12500, status: 'completed', date: '2024-01-18' },
  { id: 'TXN-0006', type: 'academy',    label: 'Vente formation marketing', amount: 120000, status: 'completed', date: '2024-01-18' },
  { id: 'TXN-0007', type: 'payout',     label: 'Retrait investisseur Alpha B.', amount: -500000, status: 'failed', date: '2024-01-17' },
  { id: 'TXN-0008', type: 'transit',    label: 'Fret TRN-002 Mamadou Commerce', amount: 1120000, status: 'pending', date: '2024-01-17' },
];

const typeConfig: Record<string, { label: string; color: string }> = {
  commission: { label: 'Commission',  color: 'bg-primary/10 text-primary' },
  payout:     { label: 'Versement',   color: 'bg-orange-500/10 text-orange-700' },
  transit:    { label: 'Transit',     color: 'bg-blue-500/10 text-blue-700' },
  academy:    { label: 'Academy',     color: 'bg-purple-500/10 text-purple-700' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  completed: { label: 'Complété',  variant: 'default',     icon: CheckCircle2 },
  pending:   { label: 'En attente', variant: 'secondary',  icon: Clock },
  failed:    { label: 'Échoué',    variant: 'destructive', icon: XCircle },
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

  return (
    <AdminLayout title="Finances" description="Revenus, versements et mouvements financiers">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground">Revenus bruts</p>
              </div>
              <p className="text-2xl font-bold text-primary">{format(totalRevenue)}</p>
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

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenus mensuels (6 mois)</CardTitle>
            <CardDescription>Commissions + Transit + Academy</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueHistory} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
                <Area type="monotone" dataKey="revenus" name="Revenus" stroke="hsl(var(--primary))" fill="url(#finGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transactions Table */}
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
                  const type = typeConfig[t.type];
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
