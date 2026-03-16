/**
 * Admin Payments Page - Real-time payment tracking with filters
 */

import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2,
  CreditCard, Smartphone, Wallet, Banknote, RefreshCw, Download,
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useAdminPayments, type PaymentRecord } from '@/hooks/useAdminPayments';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; color: string }> = {
  completed:  { label: 'Complété',   variant: 'default',     icon: CheckCircle2,  color: 'text-primary' },
  pending:    { label: 'En attente', variant: 'secondary',   icon: Clock,         color: 'text-yellow-600' },
  processing: { label: 'En cours',  variant: 'outline',     icon: RefreshCw,     color: 'text-blue-600' },
  cancelled:  { label: 'Annulé',    variant: 'destructive', icon: XCircle,       color: 'text-destructive' },
  failed:     { label: 'Échoué',    variant: 'destructive', icon: AlertTriangle, color: 'text-destructive' },
};

const methodConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  orange_money: { label: 'Orange Money', icon: Smartphone, color: 'bg-orange-500/10 text-orange-700' },
  mtn_money:    { label: 'MTN Money',    icon: Smartphone, color: 'bg-yellow-500/10 text-yellow-700' },
  card:         { label: 'Carte Visa',   icon: CreditCard, color: 'bg-blue-500/10 text-blue-700' },
  wallet:       { label: 'Wallet',       icon: Wallet,     color: 'bg-primary/10 text-primary' },
  cash:         { label: 'Cash',         icon: Banknote,   color: 'bg-green-500/10 text-green-700' },
};

function getMethodInfo(method: string) {
  return methodConfig[method] || { label: method, icon: Banknote, color: 'bg-muted text-muted-foreground' };
}

export default function AdminPaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const { format } = useCurrency();
  const { payments, loading } = useAdminPayments();

  const filtered = useMemo(() => {
    return payments.filter(p => {
      const matchSearch = searchQuery === '' ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone?.includes(searchQuery) ||
        p.sellerId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchMethod = methodFilter === 'all' || p.method === methodFilter;
      const matchType = typeFilter === 'all' || p.type === typeFilter;
      return matchSearch && matchStatus && matchMethod && matchType;
    });
  }, [payments, searchQuery, statusFilter, methodFilter, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = payments.reduce((s, p) => s + p.amount, 0);
    const completed = payments.filter(p => p.status === 'completed');
    const pending = payments.filter(p => p.status === 'pending');
    const failed = payments.filter(p => p.status === 'failed' || p.status === 'cancelled');
    const completedAmount = completed.reduce((s, p) => s + p.amount, 0);
    const pendingAmount = pending.reduce((s, p) => s + p.amount, 0);
    
    // Method breakdown
    const byMethod: Record<string, number> = {};
    payments.forEach(p => {
      byMethod[p.method] = (byMethod[p.method] || 0) + 1;
    });

    return { total, completedAmount, pendingAmount, completedCount: completed.length, pendingCount: pending.length, failedCount: failed.length, byMethod };
  }, [payments]);

  if (loading) {
    return (
      <AdminLayout title="Paiements" description="Chargement...">
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="p-12 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent></Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Paiements" description="Suivi en temps réel de tous les paiements">
      <div className="space-y-6">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground">Complétés</p>
              </div>
              <p className="text-2xl font-bold text-primary">{format(stats.completedAmount)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.completedCount} paiement{stats.completedCount !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{format(stats.pendingAmount)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.pendingCount} paiement{stats.pendingCount !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-5 h-5 text-destructive" />
                <p className="text-sm text-muted-foreground">Échoués / Annulés</p>
              </div>
              <p className="text-2xl font-bold text-destructive">{stats.failedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">paiement{stats.failedCount !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Par méthode</p>
              <div className="space-y-1">
                {Object.entries(stats.byMethod).map(([method, count]) => {
                  const info = getMethodInfo(method);
                  return (
                    <div key={method} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{info.label}</span>
                      <Badge variant="outline" className="text-xs">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Filters ── */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div>
                <CardTitle>Historique des paiements</CardTitle>
                <CardDescription>
                  {payments.length} paiement{payments.length !== 1 ? 's' : ''} • Temps réel Firestore
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ID, téléphone, vendeur..."
                    className="pl-9 w-56"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes méthodes</SelectItem>
                    <SelectItem value="orange_money">Orange Money</SelectItem>
                    <SelectItem value="mtn_money">MTN Money</SelectItem>
                    <SelectItem value="card">Carte Visa</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous types</SelectItem>
                    <SelectItem value="subscription">Abonnements</SelectItem>
                    <SelectItem value="order">Commandes</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)} disabled={filtered.length === 0}>
                  <Download className="w-4 h-4 mr-1" />
                  Export CSV ({filtered.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Status tabs */}
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">Tous ({payments.length})</TabsTrigger>
                <TabsTrigger value="pending">En attente ({stats.pendingCount})</TabsTrigger>
                <TabsTrigger value="processing">En cours</TabsTrigger>
                <TabsTrigger value="completed">Complétés ({stats.completedCount})</TabsTrigger>
                <TabsTrigger value="cancelled">Annulés</TabsTrigger>
                <TabsTrigger value="failed">Échoués</TabsTrigger>
              </TabsList>
            </Tabs>

            {filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Aucun paiement trouvé</p>
                <p className="text-xs mt-1">Les paiements apparaîtront ici en temps réel</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Plan / Détail</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 100).map(p => {
                      const status = statusConfig[p.status] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      const methodInfo = getMethodInfo(p.method);
                      const MethodIcon = methodInfo.icon;

                      return (
                        <TableRow key={`${p.type}-${p.id}`}>
                          <TableCell className="font-mono text-sm">{p.reference}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {p.type === 'subscription' ? 'Abonnement' : 'Commande'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={cn('inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium', methodInfo.color)}>
                              <MethodIcon className="w-3.5 h-3.5" />
                              {methodInfo.label}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold">{format(p.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="gap-1">
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {p.phone || '—'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {p.planName || p.cancelReason || '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {p.createdAt.toLocaleDateString('fr-FR', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {filtered.length > 100 && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Affichage des 100 premiers résultats sur {filtered.length}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
