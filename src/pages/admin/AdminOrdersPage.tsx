/**
 * Admin Orders Page - Order Management (Firestore)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format as formatDateFns } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Search, MoreHorizontal, Filter, Eye, Package, Truck, CheckCircle, XCircle, Edit, Loader2, ExternalLink, MessageSquare, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';
import { useRealtimeCollection } from '@/lib/firebase/queries';
import { updateDocument } from '@/lib/firebase/mutations';
import type { FirestoreDoc } from '@/lib/firebase/queries';
import { Timestamp, collection, getDocs } from 'firebase/firestore';
import { db, callFunction } from '@/lib/firebase/config';

type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';

interface Order extends FirestoreDoc {
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
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
  shippingAddress?: { fullName?: string };
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
  const [resendingSmsId, setResendingSmsId] = useState<string | null>(null);
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({});
  const [customerInfo, setCustomerInfo] = useState<Record<string, { name: string; email: string }>>({});

  // Advanced filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeller, setFilterSeller] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined);
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load seller/shop names + customer names
  useEffect(() => {
    const loadNames = async () => {
      const sellerMap: Record<string, string> = {};
      const customerMap: Record<string, { name: string; email: string }> = {};
      try {
        const [settingsSnap, sellersSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, 'seller_settings')),
          getDocs(collection(db, 'sellers')),
          getDocs(collection(db, 'users')),
        ]);
        sellersSnap.docs.forEach(doc => {
          const d = doc.data();
          sellerMap[doc.id] = d.shopName || d.businessName || d.displayName || doc.id.slice(0, 8);
        });
        settingsSnap.docs.forEach(doc => {
          const d = doc.data();
          if (d.shopName) sellerMap[doc.id] = d.shopName;
        });
        usersSnap.docs.forEach(doc => {
          const d = doc.data();
          customerMap[doc.id] = {
            name: d.displayName || d.fullName || d.name || '',
            email: d.email || '',
          };
        });
      } catch (e) { console.error('Error loading names:', e); }
      setSellerNames(sellerMap);
      setCustomerInfo(customerMap);
    };
    loadNames();
  }, []);

  // Helper: get customer display name
  const getCustomerDisplay = (order: Order): string => {
    // Priority: order.customerName > shippingAddress.fullName > users collection > email > ID
    if (order.customerName) return order.customerName;
    if (order.shippingAddress?.fullName) return order.shippingAddress.fullName;
    const info = order.customerId ? customerInfo[order.customerId] : null;
    if (info?.name) return info.name;
    if (order.customerEmail) return order.customerEmail;
    if (info?.email) return info.email;
    return order.customerId?.slice(0, 8) || '—';
  };

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

  // Get unique sellers for filter dropdown
  const uniqueSellers = useMemo(() => {
    const sellersSet = new Map<string, string>();
    orders.forEach(order => {
      const ids = order.sellerIds || (order.sellerId ? [order.sellerId] : []);
      ids.forEach(id => {
        if (id && !sellersSet.has(id)) {
          sellersSet.set(id, sellerNames[id] || id.slice(0, 8));
        }
      });
    });
    return Array.from(sellersSet.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [orders, sellerNames]);

  // Check if any advanced filter is active
  const hasActiveFilters = filterStatus !== 'all' || filterSeller !== 'all' || filterDateFrom || filterDateTo;

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilterStatus('all');
    setFilterSeller('all');
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
    setActiveTab('all');
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter
      const matchesSearch = (order.orderNumber || order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customerName || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      // Tab filter (quick status filter)
      const matchesTab = activeTab === 'all' || order.status === activeTab;
      
      // Advanced status filter
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      
      // Seller filter
      const orderSellerIds = order.sellerIds || (order.sellerId ? [order.sellerId] : []);
      const matchesSeller = filterSeller === 'all' || orderSellerIds.includes(filterSeller);
      
      // Date range filter
      let matchesDate = true;
      if (filterDateFrom || filterDateTo) {
        const orderDate = order.createdAt instanceof Timestamp 
          ? order.createdAt.toDate() 
          : order.createdAt ? new Date(order.createdAt) : null;
        
        if (orderDate) {
          if (filterDateFrom) {
            const fromStart = new Date(filterDateFrom);
            fromStart.setHours(0, 0, 0, 0);
            matchesDate = matchesDate && orderDate >= fromStart;
          }
          if (filterDateTo) {
            const toEnd = new Date(filterDateTo);
            toEnd.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && orderDate <= toEnd;
          }
        } else {
          matchesDate = false;
        }
      }
      
      return matchesSearch && matchesTab && matchesStatus && matchesSeller && matchesDate;
    });
  }, [orders, searchQuery, activeTab, filterStatus, filterSeller, filterDateFrom, filterDateTo]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, filterStatus, filterSeller, filterDateFrom, filterDateTo]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredOrders, currentPage]);

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

  const handleResendSms = async (order: Order) => {
    const oid = order.orderNumber || order.id;
    setResendingSmsId(order.id);
    try {
      const resend = callFunction<{ orderId: string }, { success: boolean; message: string }>('resendOrderSms');
      const result = await resend({ orderId: order.id });
      toast.success(result.data.message || `SMS renvoyé pour ${oid}`);
    } catch (err: any) {
      toast.error(err?.message || `Échec du renvoi SMS pour ${oid}`);
    } finally {
      setResendingSmsId(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('Aucune commande à exporter');
      return;
    }
    
    const headers = [
      'ID Commande',
      'Date',
      'Client',
      'Vendeurs',
      'Articles (Qté)',
      'Total',
      'Statut'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => {
        const orderDate = order.createdAt instanceof Timestamp 
          ? order.createdAt.toDate() 
          : order.createdAt ? new Date(order.createdAt) : new Date();
        
        return [
          `"${order.orderNumber || order.id}"`,
          `"${orderDate.toLocaleDateString('fr-FR')}"`,
          `"${getCustomerDisplay(order).replace(/"/g, '""')}"`,
          `"${getOrderSellers(order).map(s => s.name).join('; ').replace(/"/g, '""')}"`,
          `"${getItemCount(order)}"`,
          `"${order.totalAmount || order.total || order.pricing?.total || 0}"`,
          `"${statusConfig[order.status]?.label || order.status}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `commandes_${formatDateFns(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
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
                <Button 
                  variant={hasActiveFilters ? "default" : "outline"} 
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4" />
                </Button>
                {hasActiveFilters && (
                  <Button variant="ghost" size="icon" onClick={clearFilters} title="Effacer les filtres">
                    <X className="w-4 h-4" />
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={handleExportCSV}
                  title="Exporter les commandes filtrées en CSV"
                  className="hidden sm:flex"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>
            
            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Statut</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="confirmed">Confirmées</SelectItem>
                        <SelectItem value="shipping">En livraison</SelectItem>
                        <SelectItem value="delivered">Livrées</SelectItem>
                        <SelectItem value="cancelled">Annulées</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Seller Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Vendeur / Boutique</Label>
                    <Select value={filterSeller} onValueChange={setFilterSeller}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les vendeurs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les vendeurs</SelectItem>
                        {uniqueSellers.map(seller => (
                          <SelectItem key={seller.id} value={seller.id}>
                            {seller.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date From */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date de début</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filterDateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filterDateFrom ? formatDateFns(filterDateFrom, "PPP", { locale: fr }) : "Sélectionner"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filterDateFrom}
                          onSelect={setFilterDateFrom}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Date To */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date de fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filterDateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filterDateTo ? formatDateFns(filterDateTo, "PPP", { locale: fr }) : "Sélectionner"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filterDateTo}
                          onSelect={setFilterDateTo}
                          initialFocus
                          disabled={(date) => filterDateFrom ? date < filterDateFrom : false}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {/* Filter Summary */}
                {hasActiveFilters && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">{filteredOrders.length}</span>
                    <span>commande{filteredOrders.length > 1 ? 's' : ''} trouvée{filteredOrders.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}
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
                  ) : paginatedOrders.map((order) => {
                    const status = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    const itemCount = getItemCount(order);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">{order.orderNumber || order.id.slice(0, 12)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{getCustomerDisplay(order)}</span>
                            {order.customerId && customerInfo[order.customerId]?.email && getCustomerDisplay(order) !== customerInfo[order.customerId].email && (
                              <span className="text-xs text-muted-foreground">{customerInfo[order.customerId].email}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getOrderSellers(order).map((seller, i) => (
                              seller.id ? (
                                <button
                                  key={i}
                                  onClick={() => navigate(`/admin/sellers?highlight=${seller.id}`)}
                                  className="text-primary hover:underline cursor-pointer text-sm"
                                >
                                  {seller.name}
                                </button>
                              ) : (
                                <span key={i} className="text-muted-foreground text-sm">{seller.name}</span>
                              )
                            ))}
                          </div>
                        </TableCell>
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
                              <DropdownMenuItem onClick={() => navigate(`/admin/orders/${order.id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleResendSms(order)}
                                disabled={resendingSmsId === order.id}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                {resendingSmsId === order.id ? 'Envoi...' : 'Renvoyer SMS'}
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
            )}

            {!loading && !error && filteredOrders.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground hidden md:block">
                  Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredOrders.length)} sur {filteredOrders.length} commandes
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Précédent</span>
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="px-1 text-muted-foreground">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <span className="hidden sm:inline">Suivant</span>
                    <ChevronRight className="w-4 h-4 sm:ml-1" />
                  </Button>
                </div>
              </div>
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
