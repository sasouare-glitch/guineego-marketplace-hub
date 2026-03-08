/**
 * Admin Orders Page - Order Management (Firestore)
 */

import { useState, useEffect, useMemo } from 'react';
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
import { Search, MoreHorizontal, Filter, Eye, Package, Truck, CheckCircle, XCircle, Edit, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';
import { useRealtimeCollection } from '@/lib/firebase/queries';
import { updateDocument } from '@/lib/firebase/mutations';
import type { FirestoreDoc } from '@/lib/firebase/queries';
import { Timestamp, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';

interface Order extends FirestoreDoc {
  orderNumber?: string;
  customerName?: string;
  customerId?: string;
  sellerName?: string;
  sellerId?: string;
  sellerIds?: string[];
  sellers?: Record<string, any>;
  total?: number;
  totalAmount?: number;
  pricing?: { total?: number; subtotal?: number; fees?: number };
  status: OrderStatus;
  items?: any[];
}

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending: { label: 'En attente', variant: 'secondary', icon: Package },
  confirmed: { label: 'Confirmée', variant: 'default', icon: CheckCircle },
  shipping: { label: 'En livraison', variant: 'outline', icon: Truck },
  delivered: { label: 'Livrée', variant: 'default', icon: CheckCircle },
  cancelled: { label: 'Annulée', variant: 'destructive', icon: XCircle },
};

const statusFlow: OrderStatus[] = ['pending', 'confirmed', 'shipping', 'delivered'];

export default function AdminOrdersPage() {
  const { data: orders, loading, error } = useRealtimeCollection<Order>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; action: () => void }>({ open: false, title: '', description: '', action: () => {} });
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; order: Order | null; newStatus: OrderStatus | '' }>({ open: false, order: null, newStatus: '' });
  const [saving, setSaving] = useState(false);
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({});

  // Load seller/shop names
  useEffect(() => {
    const loadSellerNames = async () => {
      const nameMap: Record<string, string> = {};
      try {
        const [settingsSnap, sellersSnap] = await Promise.all([
          getDocs(collection(db, 'seller_settings')),
          getDocs(collection(db, 'sellers')),
        ]);
        sellersSnap.docs.forEach(doc => {
          const d = doc.data();
          nameMap[doc.id] = d.shopName || d.businessName || d.displayName || doc.id.slice(0, 8);
        });
        settingsSnap.docs.forEach(doc => {
          const d = doc.data();
          if (d.shopName) nameMap[doc.id] = d.shopName;
        });
      } catch (e) { console.error('Error loading seller names:', e); }
      setSellerNames(nameMap);
    };
    loadSellerNames();
  }, []);

  // Helper: get seller info for an order
  const getOrderSellers = (order: Order): { id: string; name: string }[] => {
    const ids = order.sellerIds || (order.sellerId ? [order.sellerId] : []);
    if (ids.length === 0) return [{ id: '', name: order.sellerName || '—' }];
    return ids.map(id => ({ id, name: sellerNames[id] || order.sellerName || id.slice(0, 8) }));
  };

  // Helper: count total items
  const getItemCount = (order: Order): number => {
    if (order.items && order.items.length > 0) {
      return order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }
    return 0;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.orderNumber || order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerName || '').toLowerCase().includes(searchQuery.toLowerCase());
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

  const handleCancel = (order: Order) => {
    setConfirmDialog({
      open: true,
      title: 'Annuler cette commande ?',
      description: `La commande "${order.orderNumber || order.id}" sera annulée.`,
      action: async () => {
        try {
          await updateDocument('orders', order.id, { status: 'cancelled' });
          toast.success(`Commande ${order.orderNumber || order.id} annulée`);
        } catch { toast.error('Erreur lors de l\'annulation'); }
      }
    });
  };

  const handleOpenStatusDialog = (order: Order) => {
    setStatusDialog({ open: true, order, newStatus: '' });
  };

  const handleUpdateStatus = async () => {
    if (!statusDialog.order || !statusDialog.newStatus) return;
    setSaving(true);
    try {
      await updateDocument('orders', statusDialog.order.id, { status: statusDialog.newStatus });
      toast.success(`Commande ${statusDialog.order.orderNumber || statusDialog.order.id} → ${statusConfig[statusDialog.newStatus as OrderStatus].label}`);
      setStatusDialog({ open: false, order: null, newStatus: '' });
    } catch { toast.error('Erreur lors de la mise à jour'); }
    finally { setSaving(false); }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('fr-FR');
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

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-10 text-destructive">
                <p>Erreur lors du chargement</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Vendeur / Boutique</TableHead>
                    <TableHead className="text-center">Articles</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>Aucune commande trouvée</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.map((order) => {
                    const status = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    const itemCount = getItemCount(order);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">{order.orderNumber || order.id.slice(0, 12)}</TableCell>
                        <TableCell>{order.customerName || order.customerId || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{getOrderSellerNames(order)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{itemCount}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{format(order.pricing?.total || order.totalAmount || order.total || 0)}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(order.createdAt)}
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
            )}
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
            <DialogDescription>Commande {statusDialog.order?.orderNumber || statusDialog.order?.id}</DialogDescription>
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
            <Button onClick={handleUpdateStatus} disabled={!statusDialog.newStatus || saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
