/**
 * Admin Deliveries Page - Delivery Mission Management (Firestore)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, MoreHorizontal, Truck, Clock, CheckCircle2, 
  MapPin, AlertCircle, Package, User, RefreshCw, Loader2, UserPlus
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/hooks/useCurrency';
import { db } from '@/lib/firebase/config';
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc,
  serverTimestamp, arrayUnion, Timestamp, getDocs, where
} from 'firebase/firestore';
import { toast } from 'sonner';
import { format as formatDate } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DeliveryMission {
  id: string;
  orderId: string;
  customerId?: string;
  assignedCourier: string | null;
  pickup: { address: string; commune: string; phone: string; instructions?: string };
  delivery: { address: string; commune: string; phone?: string; fullName?: string };
  priority: 'normal' | 'express';
  fee: number;
  estimatedTime?: number;
  status: string;
  statusHistory?: { status: string; timestamp: Timestamp; note?: string }[];
  createdAt?: Timestamp;
  deliveredAt?: Timestamp;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending:        { label: 'En attente',  variant: 'secondary',    icon: Clock },
  accepted:       { label: 'Acceptée',    variant: 'outline',      icon: User },
  pickup_started: { label: 'Ramassage',   variant: 'outline',      icon: Package },
  picked_up:      { label: 'Récupéré',    variant: 'outline',      icon: Package },
  in_transit:     { label: 'En route',     variant: 'default',      icon: Truck },
  arrived:        { label: 'Arrivé',       variant: 'default',      icon: MapPin },
  delivered:      { label: 'Livrée',       variant: 'default',      icon: CheckCircle2 },
  cancelled:      { label: 'Annulée',      variant: 'destructive',  icon: AlertCircle },
};

export default function AdminDeliveriesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [missions, setMissions] = useState<DeliveryMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [courierNames, setCourierNames] = useState<Record<string, string>>({});
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const { format } = useCurrency();
  
  // Courier assignment
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignMissionId, setAssignMissionId] = useState<string | null>(null);
  const [couriers, setCouriers] = useState<{ id: string; name: string; phone?: string }[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [loadingCouriers, setLoadingCouriers] = useState(false);

  // Real-time deliveries listener
  useEffect(() => {
    const q = query(collection(db, 'deliveries'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as DeliveryMission));
      setMissions(data);
      setLoading(false);

      // Collect unique courier & customer IDs to resolve names
      const courierIds = new Set<string>();
      const customerIds = new Set<string>();
      data.forEach(m => {
        if (m.assignedCourier) courierIds.add(m.assignedCourier);
        if (m.customerId) customerIds.add(m.customerId);
      });
      resolveNames([...courierIds], [...customerIds]);
    }, (err) => {
      console.error('Error fetching deliveries:', err);
      toast.error('Erreur de chargement des livraisons');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const resolveNames = async (courierIds: string[], customerIds: string[]) => {
    try {
      // Resolve courier names from users collection
      if (courierIds.length > 0) {
        const usersSnap = await getDocs(collection(db, 'users'));
        const map: Record<string, string> = {};
        usersSnap.docs.forEach(d => {
          const data = d.data();
          if (courierIds.includes(d.id)) {
            map[d.id] = data.displayName || data.fullName || data.email || d.id.slice(0, 8);
          }
        });
        setCourierNames(prev => ({ ...prev, ...map }));
      }

      // Resolve customer names
      if (customerIds.length > 0) {
        const usersSnap = await getDocs(collection(db, 'users'));
        const map: Record<string, string> = {};
        usersSnap.docs.forEach(d => {
          const data = d.data();
          if (customerIds.includes(d.id)) {
            map[d.id] = data.displayName || data.fullName || data.email || d.id.slice(0, 8);
          }
        });
        setCustomerNames(prev => ({ ...prev, ...map }));
      }
    } catch (err) {
      console.error('Error resolving names:', err);
    }
  };

  const getCourierDisplay = (m: DeliveryMission) => {
    if (!m.assignedCourier) return null;
    return courierNames[m.assignedCourier] || m.assignedCourier.slice(0, 8);
  };

  const getCustomerDisplay = (m: DeliveryMission) => {
    if (m.delivery?.fullName) return m.delivery.fullName;
    if (m.customerId && customerNames[m.customerId]) return customerNames[m.customerId];
    return m.customerId?.slice(0, 8) || '—';
  };

  const getZone = (m: DeliveryMission) => m.delivery?.commune || '—';

  const getCreatedDate = (m: DeliveryMission) => {
    if (!m.createdAt) return '—';
    try {
      return formatDate(m.createdAt.toDate(), 'dd MMM yyyy HH:mm', { locale: fr });
    } catch {
      return '—';
    }
  };

  const filtered = missions.filter(d => {
    const search = searchQuery.toLowerCase();
    const matchSearch = !search ||
      d.id.toLowerCase().includes(search) ||
      d.orderId?.toLowerCase().includes(search) ||
      getCourierDisplay(d)?.toLowerCase().includes(search) ||
      getCustomerDisplay(d).toLowerCase().includes(search) ||
      getZone(d).toLowerCase().includes(search);
    const matchTab = activeTab === 'all' || d.status === activeTab;
    return matchSearch && matchTab;
  });

  const stats = {
    total: missions.length,
    pending: missions.filter(d => d.status === 'pending').length,
    inProgress: missions.filter(d => ['accepted', 'pickup_started', 'picked_up', 'in_transit', 'arrived'].includes(d.status)).length,
    delivered: missions.filter(d => d.status === 'delivered').length,
    failed: missions.filter(d => d.status === 'cancelled').length,
  };

  const handleCancelMission = async (missionId: string) => {
    try {
      await updateDoc(doc(db, 'deliveries', missionId), {
        status: 'cancelled',
        statusHistory: arrayUnion({
          status: 'cancelled',
          timestamp: Timestamp.now(),
          note: 'Annulée par l\'administrateur',
        }),
        updatedAt: serverTimestamp(),
      });
      toast.success('Mission annulée');
    } catch (err) {
      console.error('Error cancelling mission:', err);
      toast.error('Erreur lors de l\'annulation');
    }
  };

  const openAssignDialog = (missionId: string) => {
    setAssignMissionId(missionId);
    setSelectedCourierId('');
    setAssignDialogOpen(true);
    // Fetch couriers
    if (couriers.length === 0) {
      setLoadingCouriers(true);
      getDocs(collection(db, 'courier_settings')).then((snap) => {
        const ids = snap.docs.map(d => ({ uid: d.data().userId || d.id, phone: d.data().phone }));
        getDocs(collection(db, 'users')).then((usersSnap) => {
          const userMap: Record<string, any> = {};
          usersSnap.docs.forEach(d => { userMap[d.id] = d.data(); });
          setCouriers(ids.map(c => ({
            id: c.uid,
            name: userMap[c.uid]?.displayName || userMap[c.uid]?.fullName || userMap[c.uid]?.email || c.uid.slice(0, 8),
            phone: c.phone || userMap[c.uid]?.phone,
          })));
          setLoadingCouriers(false);
        });
      }).catch(() => setLoadingCouriers(false));
    }
  };

  const handleAssignCourier = async () => {
    if (!selectedCourierId || !assignMissionId) return;
    setAssigning(true);
    try {
      const courier = couriers.find(c => c.id === selectedCourierId);
      const mission = missions.find(m => m.id === assignMissionId);
      const isReassign = !!mission?.assignedCourier;
      const prevName = mission?.assignedCourier ? (courierNames[mission.assignedCourier] || mission.assignedCourier.slice(0, 8)) : '';
      const note = isReassign
        ? `Réassigné par l'administrateur (ancien: ${prevName})`
        : 'Assigné manuellement par l\'administrateur';

      await updateDoc(doc(db, 'deliveries', assignMissionId), {
        assignedCourier: selectedCourierId,
        assignedCourierId: selectedCourierId,
        courierName: courier?.name || '',
        courierPhone: courier?.phone || '',
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        statusHistory: arrayUnion({
          status: 'accepted',
          timestamp: Timestamp.now(),
          note,
        }),
        updatedAt: serverTimestamp(),
      });
      toast.success(`Coursier ${courier?.name} ${isReassign ? 'réassigné' : 'assigné'}`);
      setAssignDialogOpen(false);
    } catch (err) {
      console.error('Error assigning courier:', err);
      toast.error('Erreur lors de l\'assignation');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <AdminLayout title="Livraisons" description="Suivi des missions de livraison en temps réel">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">En cours</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              <p className="text-sm text-muted-foreground">Livrées</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
              <p className="text-sm text-muted-foreground">Annulées</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Missions de livraison</CardTitle>
                <CardDescription>Données en temps réel depuis Firestore</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ID, coursier, client, zone..."
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList className="flex-wrap">
                <TabsTrigger value="all">Toutes ({missions.length})</TabsTrigger>
                <TabsTrigger value="pending">En attente</TabsTrigger>
                <TabsTrigger value="accepted">Acceptées</TabsTrigger>
                <TabsTrigger value="in_transit">En route</TabsTrigger>
                <TabsTrigger value="delivered">Livrées</TabsTrigger>
                <TabsTrigger value="cancelled">Annulées</TabsTrigger>
              </TabsList>
            </Tabs>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Chargement...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucune mission de livraison trouvée</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mission</TableHead>
                    <TableHead>Coursier</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Frais</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(d => {
                    const s = statusConfig[d.status] || statusConfig.pending;
                    const Icon = s.icon;
                    const courierName = getCourierDisplay(d);
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono text-sm">
                          <div>
                            <button onClick={() => navigate(`/admin/deliveries/${d.id}`)} className="font-medium text-primary hover:underline">
                              {d.id.slice(0, 12)}
                            </button>
                            <p className="text-xs text-muted-foreground">{d.orderId || '—'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-muted-foreground" />
                            <span className={!courierName ? 'text-muted-foreground italic' : ''}>
                              {courierName || 'Non assigné'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getCustomerDisplay(d)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            {getZone(d)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{format(d.fee)}</TableCell>
                        <TableCell>
                          <Badge variant={d.priority === 'express' ? 'destructive' : 'outline'}>
                            {d.priority === 'express' ? 'Express' : 'Normal'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.variant} className="gap-1">
                            <Icon className="w-3 h-3" />
                            {s.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{getCreatedDate(d)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/admin/deliveries/${d.id}`)}>Voir détails</DropdownMenuItem>
                              {d.status === 'pending' && !d.assignedCourier && (
                                <DropdownMenuItem onClick={() => openAssignDialog(d.id)}>
                                  <UserPlus className="w-4 h-4 mr-2" /> Assigner coursier
                                </DropdownMenuItem>
                              )}
                              {d.assignedCourier && d.status !== 'delivered' && d.status !== 'cancelled' && (
                                <DropdownMenuItem onClick={() => openAssignDialog(d.id)}>
                                  <UserPlus className="w-4 h-4 mr-2" /> Réassigner coursier
                                </DropdownMenuItem>
                              )}
                              {d.status !== 'delivered' && d.status !== 'cancelled' && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleCancelMission(d.id)}
                                >
                                  Annuler mission
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

      {/* Assign Courier Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un coursier</DialogTitle>
            <DialogDescription>
              Mission : {assignMissionId?.slice(0, 12)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {loadingCouriers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Chargement des coursiers...
              </div>
            ) : couriers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun coursier enregistré</p>
            ) : (
              <Select value={selectedCourierId} onValueChange={setSelectedCourierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un coursier" />
                </SelectTrigger>
                <SelectContent>
                  {couriers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAssignCourier} disabled={!selectedCourierId || assigning} className="gap-2">
              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {assigning ? 'Assignation...' : 'Assigner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
