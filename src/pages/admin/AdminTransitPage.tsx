/**
 * Admin Transit Page - China-Guinea Shipment Management
 * Persisted with Firestore collection "transit"
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, MoreHorizontal, Globe, Package, Plane, Ship, 
  Clock, CheckCircle2, AlertCircle, RefreshCw, Banknote, Plus, Loader2
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useRealtimeCollection, type FirestoreDoc } from '@/lib/firebase/queries';
import { addDocument, updateDocument } from '@/lib/firebase/mutations';
import { orderBy } from 'firebase/firestore';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface Shipment extends FirestoreDoc {
  shipmentId: string;
  client: string;
  weight: number;
  mode: 'air' | 'sea';
  origin: string;
  destination: string;
  cost: number;
  status: string;
  eta: string;
}

// ============================================
// CONFIGS
// ============================================

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending:     { label: 'En attente',   variant: 'secondary',    icon: Clock },
  preparation: { label: 'Préparation',  variant: 'outline',      icon: Package },
  in_transit:  { label: 'En transit',   variant: 'default',      icon: Globe },
  customs:     { label: 'Douanes',      variant: 'outline',      icon: AlertCircle },
  delivered:   { label: 'Livré',        variant: 'default',      icon: CheckCircle2 },
};

const modeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  air: { label: 'Fret Aérien', icon: Plane },
  sea: { label: 'Fret Maritime', icon: Ship },
};

const defaultForm = {
  shipmentId: '', client: '', weight: 0, mode: 'air' as 'air' | 'sea',
  origin: 'Guangzhou', destination: 'Conakry', cost: 0, status: 'pending', eta: '',
};

// ============================================
// COMPONENT
// ============================================

export default function AdminTransitPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const { format } = useCurrency();

  const { data: shipments, loading } = useRealtimeCollection<Shipment>(
    'transit',
    [orderBy('createdAt', 'desc')]
  );

  const filtered = shipments.filter(s => {
    const matchSearch = (s.shipmentId || s.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.client?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = activeTab === 'all' || s.status === activeTab;
    return matchSearch && matchTab;
  });

  const totalRevenue = shipments.reduce((sum, s) => sum + (s.cost || 0), 0);
  const airCount = shipments.filter(s => s.mode === 'air').length;
  const seaCount = shipments.filter(s => s.mode === 'sea').length;

  const handleAdd = async () => {
    if (!form.client || !form.shipmentId) {
      toast.error('ID et client sont requis');
      return;
    }
    setSaving(true);
    try {
      await addDocument('transit', { ...form });
      toast.success('Expédition créée');
      setForm(defaultForm);
      setAddOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusDialog || !newStatus) return;
    setSaving(true);
    try {
      await updateDocument('transit', statusDialog.id, { status: newStatus });
      toast.success('Statut mis à jour');
      setStatusDialog(null);
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Transit" description="Gestion des expéditions Chine-Guinée">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{shipments.length}</p>
              <p className="text-sm text-muted-foreground">Expéditions totales</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                <p className="text-xl font-bold text-primary">{format(totalRevenue)}</p>
              </div>
              <p className="text-sm text-muted-foreground">Revenus transit</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-600" />
                <p className="text-2xl font-bold text-blue-600">{airCount}</p>
              </div>
              <p className="text-sm text-muted-foreground">Fret Aérien</p>
            </CardContent>
          </Card>
          <Card className="border-cyan-500/20 bg-cyan-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Ship className="w-5 h-5 text-cyan-600" />
                <p className="text-2xl font-bold text-cyan-600">{seaCount}</p>
              </div>
              <p className="text-sm text-muted-foreground">Fret Maritime</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Expéditions</CardTitle>
                <CardDescription>Suivi de toutes les expéditions Chine-Guinée</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ID, client..."
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={() => setAddOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Nouvelle
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList className="flex-wrap">
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="pending">En attente</TabsTrigger>
                <TabsTrigger value="preparation">Préparation</TabsTrigger>
                <TabsTrigger value="in_transit">En transit</TabsTrigger>
                <TabsTrigger value="customs">Douanes</TabsTrigger>
                <TabsTrigger value="delivered">Livrées</TabsTrigger>
              </TabsList>
            </Tabs>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">Aucune expédition trouvée</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Trajet</TableHead>
                    <TableHead>Poids</TableHead>
                    <TableHead>Coût</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(s => {
                    const status = statusConfig[s.status] || statusConfig.pending;
                    const mode = modeConfig[s.mode] || modeConfig.air;
                    const StatusIcon = status.icon;
                    const ModeIcon = mode.icon;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono font-medium">{s.shipmentId || s.id}</TableCell>
                        <TableCell>{s.client}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <ModeIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{mode.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.origin} → {s.destination}
                        </TableCell>
                        <TableCell>{s.weight} kg</TableCell>
                        <TableCell className="font-medium">{format(s.cost)}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {s.eta ? new Date(s.eta).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setStatusDialog(s); setNewStatus(s.status); }}>
                                Mettre à jour statut
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Shipment Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle expédition</DialogTitle>
            <DialogDescription>Créer une expédition dans la collection transit</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Expédition</Label>
                <Input value={form.shipmentId} onChange={e => setForm(p => ({ ...p, shipmentId: e.target.value }))} placeholder="TRN-006" />
              </div>
              <div className="space-y-2">
                <Label>Client</Label>
                <Input value={form.client} onChange={e => setForm(p => ({ ...p, client: e.target.value }))} placeholder="Nom du client" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={form.mode} onValueChange={v => setForm(p => ({ ...p, mode: v as 'air' | 'sea' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="air">Fret Aérien</SelectItem>
                    <SelectItem value="sea">Fret Maritime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Poids (kg)</Label>
                <Input type="number" value={form.weight || ''} onChange={e => setForm(p => ({ ...p, weight: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origine</Label>
                <Input value={form.origin} onChange={e => setForm(p => ({ ...p, origin: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Destination</Label>
                <Input value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coût (GNF)</Label>
                <Input type="number" value={form.cost || ''} onChange={e => setForm(p => ({ ...p, cost: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>ETA</Label>
                <Input type="date" value={form.eta} onChange={e => setForm(p => ({ ...p, eta: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={!!statusDialog} onOpenChange={open => !open && setStatusDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre à jour le statut</DialogTitle>
            <DialogDescription>{statusDialog?.shipmentId || statusDialog?.id} — {statusDialog?.client}</DialogDescription>
          </DialogHeader>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(null)}>Annuler</Button>
            <Button onClick={handleUpdateStatus} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
