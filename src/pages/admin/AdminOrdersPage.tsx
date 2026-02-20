/**
 * Admin Orders Page - Order Management
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MoreHorizontal, Filter, Eye, Package, Truck, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';

interface MockOrder {
  id: string;
  customer: string;
  seller: string;
  total: number;
  status: OrderStatus;
  date: string;
}

const initialOrders: MockOrder[] = [
  { id: 'GGO-12345678', customer: 'Mamadou D.', seller: 'TechStore GN', total: 450000, status: 'pending', date: '2024-01-20' },
  { id: 'GGO-12345679', customer: 'Fatoumata B.', seller: 'Mode Conakry', total: 125000, status: 'confirmed', date: '2024-01-20' },
  { id: 'GGO-12345680', customer: 'Ibrahima S.', seller: 'ElectroGN', total: 890000, status: 'shipping', date: '2024-01-19' },
  { id: 'GGO-12345681', customer: 'Aissatou C.', seller: 'BeautyGN', total: 75000, status: 'delivered', date: '2024-01-18' },
  { id: 'GGO-12345682', customer: 'Oumar B.', seller: 'TechStore GN', total: 320000, status: 'cancelled', date: '2024-01-17' },
];

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending: { label: 'En attente', variant: 'secondary', icon: Package },
  confirmed: { label: 'Confirmée', variant: 'default', icon: CheckCircle },
  shipping: { label: 'En livraison', variant: 'outline', icon: Truck },
  delivered: { label: 'Livrée', variant: 'default', icon: CheckCircle },
  cancelled: { label: 'Annulée', variant: 'destructive', icon: XCircle },
};

const statusFlow: OrderStatus[] = ['pending', 'confirmed', 'shipping', 'delivered'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<MockOrder[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { format } = useCurrency();

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; action: () => void }>({ open: false, title: '', description: '', action: () => {} });
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; order: MockOrder | null; newStatus: OrderStatus | '' }>({ open: false, order: null, newStatus: '' });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const counts = {
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipping: orders.filter(o => o.status === 'shipping').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const handleCancel = (order: MockOrder) => {
    setConfirmDialog({
      open: true,
      title: 'Annuler cette commande ?',
      description: `La commande "${order.id}" de ${order.customer} sera annulée. Le client sera notifié et un remboursement sera initié.`,
      action: () => {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' as const } : o));
        toast.success(`Commande ${order.id} annulée`);
      }
    });
  };

  const handleOpenStatusDialog = (order: MockOrder) => {
    setStatusDialog({ open: true, order, newStatus: '' });
  };

  const handleUpdateStatus = () => {
    if (!statusDialog.order || !statusDialog.newStatus) return;
    setOrders(prev => prev.map(o => o.id === statusDialog.order!.id ? { ...o, status: statusDialog.newStatus as OrderStatus } : o));
    toast.success(`Commande ${statusDialog.order.id} → ${statusConfig[statusDialog.newStatus as OrderStatus].label}`);
    setStatusDialog({ open: false, order: null, newStatus: '' });
  };

  return (
    <AdminLayout title="Commandes" description="Suivi et gestion des commandes">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-blue-600">{counts.shipping}</p>
              <p className="text-sm text-muted-foreground">En livraison</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-green-600">{counts.delivered}</p>
              <p className="text-sm text-muted-foreground">Livrées</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-red-600">{counts.cancelled}</p>
              <p className="text-sm text-muted-foreground">Annulées</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Liste des commandes</CardTitle>
                <CardDescription>Gérez et suivez toutes les commandes</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher par ID ou client..." 
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">Toutes ({orders.length})</TabsTrigger>
                <TabsTrigger value="pending">En attente ({counts.pending})</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmées ({counts.confirmed})</TabsTrigger>
                <TabsTrigger value="shipping">En livraison ({counts.shipping})</TabsTrigger>
                <TabsTrigger value="delivered">Livrées ({counts.delivered})</TabsTrigger>
              </TabsList>
            </Tabs>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Vendeur</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>Aucune commande trouvée</p>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.map((order) => {
                  const status = statusConfig[order.status];
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell className="text-muted-foreground">{order.seller}</TableCell>
                      <TableCell className="font-medium">{format(order.total)}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <DropdownMenuItem onClick={() => handleOpenStatusDialog(order)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Mettre à jour statut
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <DropdownMenuItem className="text-destructive" onClick={() => handleCancel(order)}>
                                <XCircle className="w-4 h-4 mr-2" />
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

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.action}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialog.open} onOpenChange={(open) => setStatusDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre à jour le statut</DialogTitle>
            <DialogDescription>Commande {statusDialog.order?.id} — {statusDialog.order?.customer}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nouveau statut</Label>
              <Select value={statusDialog.newStatus} onValueChange={(val) => setStatusDialog(prev => ({ ...prev, newStatus: val as OrderStatus }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {statusFlow.map(s => (
                    <SelectItem key={s} value={s} disabled={s === statusDialog.order?.status}>
                      {statusConfig[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog({ open: false, order: null, newStatus: '' })}>Annuler</Button>
            <Button onClick={handleUpdateStatus} disabled={!statusDialog.newStatus}>Mettre à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
