/**
 * Admin Delivery Detail Page
 * Shows mission info, status history timeline, and GPS tracking
 */

import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Truck, MapPin, Clock, User, Phone, Package,
  CheckCircle2, AlertCircle, Navigation, XCircle, Check, Loader2, UserPlus
} from 'lucide-react';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';
import { useCurrency } from '@/hooks/useCurrency';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DeliveryMap } from '@/components/delivery/DeliveryMap';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, serverTimestamp, Timestamp, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// Status config for badges
const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  pending:        { label: 'En attente',  variant: 'secondary',   color: 'text-yellow-600' },
  accepted:       { label: 'Acceptée',    variant: 'outline',     color: 'text-blue-600' },
  pickup_started: { label: 'Ramassage',   variant: 'outline',     color: 'text-blue-600' },
  picked_up:      { label: 'Récupéré',    variant: 'outline',     color: 'text-indigo-600' },
  in_transit:     { label: 'En route',     variant: 'default',     color: 'text-primary' },
  arrived:        { label: 'Arrivé',       variant: 'default',     color: 'text-primary' },
  delivered:      { label: 'Livrée',       variant: 'default',     color: 'text-green-600' },
  cancelled:      { label: 'Annulée',      variant: 'destructive', color: 'text-destructive' },
};

const statusIcons: Record<string, React.ReactNode> = {
  pending:        <Clock className="w-4 h-4" />,
  accepted:       <User className="w-4 h-4" />,
  pickup_started: <Truck className="w-4 h-4" />,
  picked_up:      <Package className="w-4 h-4" />,
  in_transit:     <Truck className="w-4 h-4" />,
  arrived:        <MapPin className="w-4 h-4" />,
  delivered:      <CheckCircle2 className="w-4 h-4" />,
  cancelled:      <XCircle className="w-4 h-4" />,
};

function formatTs(ts: any): string {
  if (!ts) return '—';
  try {
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

function formatTime(ts: any): string {
  if (!ts) return '';
  try {
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export default function AdminDeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { format } = useCurrency();
  const {
    delivery, loading, currentStatus, progress, statusMessage,
    courierLocation, lastLocationUpdate, timeRemaining, statusHistory,
  } = useDeliveryTracking(id);

  // Resolve courier name
  const [courierName, setCourierName] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);

  // Courier assignment / reassignment
  const [couriers, setCouriers] = useState<{ id: string; name: string; phone?: string }[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [showReassign, setShowReassign] = useState(false);

  useEffect(() => {
    if (!delivery) return;
    const resolveUser = async (uid: string, setter: (n: string) => void) => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const d = snap.data();
          setter(d.displayName || d.fullName || d.email || uid.slice(0, 8));
        }
      } catch { /* ignore */ }
    };
    if (delivery.assignedCourier) resolveUser(delivery.assignedCourier, setCourierName);
    if (delivery.customerId) resolveUser(delivery.customerId, setCustomerName);
  }, [delivery?.assignedCourier, delivery?.customerId]);

  // Fetch couriers list (for assign or reassign)
  const fetchCouriers = () => {
    if (couriers.length > 0) return;
    setLoadingCouriers(true);
    getDocs(query(collection(db, 'courier_settings'))).then((snap) => {
      const ids = snap.docs.map(d => ({ uid: d.data().userId || d.id, phone: d.data().phone }));
      getDocs(collection(db, 'users')).then((usersSnap) => {
        const userMap: Record<string, any> = {};
        usersSnap.docs.forEach(d => { userMap[d.id] = d.data(); });
        const list = ids.map(c => ({
          id: c.uid,
          name: userMap[c.uid]?.displayName || userMap[c.uid]?.fullName || userMap[c.uid]?.email || c.uid.slice(0, 8),
          phone: c.phone || userMap[c.uid]?.phone,
        }));
        setCouriers(list);
        setLoadingCouriers(false);
      });
    }).catch(() => setLoadingCouriers(false));
  };

  // Auto-fetch when no courier assigned
  useEffect(() => {
    if (!delivery?.assignedCourier) fetchCouriers();
  }, [delivery?.assignedCourier]);

  const handleAssignCourier = async () => {
    if (!selectedCourierId || !id) return;
    setAssigning(true);
    try {
      const courierUser = couriers.find(c => c.id === selectedCourierId);
      await updateDoc(doc(db, 'deliveries', id), {
        assignedCourier: selectedCourierId,
        assignedCourierId: selectedCourierId,
        courierName: courierUser?.name || '',
        courierPhone: courierUser?.phone || '',
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        statusHistory: arrayUnion({
          status: 'accepted',
          timestamp: Timestamp.now(),
          note: 'Assigné manuellement par l\'administrateur',
        }),
        updatedAt: serverTimestamp(),
      });
      toast.success(`Coursier ${courierUser?.name} assigné avec succès`);
      setSelectedCourierId('');
    } catch (err) {
      console.error('Error assigning courier:', err);
      toast.error('Erreur lors de l\'assignation du coursier');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Détail mission" description="Chargement...">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!delivery) {
    return (
      <AdminLayout title="Mission introuvable" description="">
        <div className="text-center py-16">
          <Truck className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">Cette mission de livraison n'existe pas.</p>
          <Button variant="outline" onClick={() => navigate('/admin/deliveries')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux livraisons
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const sc = statusConfig[currentStatus || 'pending'] || statusConfig.pending;

  return (
    <AdminLayout title={`Mission ${id?.slice(0, 12)}`} description="Détail et suivi de la mission">
      <div className="space-y-6">
        {/* Back button + status */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate('/admin/deliveries')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Button>
          <Badge variant={sc.variant} className="gap-1 text-sm px-3 py-1">
            {statusIcons[currentStatus || 'pending']}
            {sc.label}
          </Badge>
        </div>

        {/* Progress bar */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Collecte</span>
              <span>{statusMessage}</span>
              <span>Livraison</span>
            </div>
            <Progress value={progress} className="h-2.5" />
            {timeRemaining !== null && timeRemaining > 0 && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Arrivée estimée dans <span className="font-semibold text-foreground">{timeRemaining} min</span>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Info + Addresses */}
          <div className="space-y-6">
            {/* Mission info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mission ID</span>
                  <span className="font-mono text-foreground">{id}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commande</span>
                  <span className="font-mono text-foreground">{delivery.orderId || '—'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frais</span>
                  <span className="font-semibold text-foreground">{format(delivery.fee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priorité</span>
                  <Badge variant={delivery.priority === 'express' ? 'destructive' : 'outline'}>
                    {delivery.priority === 'express' ? 'Express' : 'Normal'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="text-foreground">{customerName || delivery.delivery?.fullName || '—'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créée le</span>
                  <span className="text-foreground">{formatTs((delivery as any).createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Adresses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Point de collecte</p>
                    <p className="text-sm font-medium text-foreground">{delivery.pickup?.address || '—'}</p>
                    <p className="text-xs text-muted-foreground">{delivery.pickup?.commune}</p>
                    {delivery.pickup?.phone && (
                      <a href={`tel:${delivery.pickup.phone}`} className="text-xs text-primary flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" /> {delivery.pickup.phone}
                      </a>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Destination</p>
                    <p className="text-sm font-medium text-foreground">{delivery.delivery?.address || '—'}</p>
                    <p className="text-xs text-muted-foreground">{delivery.delivery?.commune}</p>
                    {delivery.delivery?.phone && (
                      <a href={`tel:${delivery.delivery.phone}`} className="text-xs text-primary flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" /> {delivery.delivery.phone}
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Timeline + GPS */}
          <div className="space-y-6">
            {/* Courier card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" /> Coursier
                </CardTitle>
              </CardHeader>
              <CardContent>
                {delivery.assignedCourier ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{courierName || delivery.assignedCourier.slice(0, 8)}</p>
                        {(delivery as any).courierPhone && (
                          <a href={`tel:${(delivery as any).courierPhone}`} className="text-xs text-primary flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {(delivery as any).courierPhone}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* GPS Map */}
                    {courierLocation && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">Position GPS en direct</span>
                        </div>
                        <DeliveryMap
                          courierPosition={{ lat: courierLocation.lat, lng: courierLocation.lng }}
                          courierName={courierName || 'Coursier'}
                          pickupLabel={delivery.pickup?.address}
                          deliveryLabel={delivery.delivery?.address}
                          className="h-[300px]"
                        />
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {courierLocation.speed && courierLocation.speed > 0 && (
                            <span>🏎️ {Math.round(courierLocation.speed * 3.6)} km/h</span>
                          )}
                          {courierLocation.accuracy && (
                            <span>📡 ±{Math.round(courierLocation.accuracy)} m</span>
                          )}
                          {lastLocationUpdate && (
                            <span>🕐 {lastLocationUpdate.toLocaleTimeString('fr-FR')}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {!courierLocation && (
                      <p className="text-sm text-muted-foreground italic">
                        Pas de position GPS disponible
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground italic">Aucun coursier assigné</p>
                    
                    {currentStatus === 'pending' && (
                      <div className="space-y-3 p-3 rounded-lg border border-dashed border-border bg-muted/30">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <UserPlus className="w-4 h-4" />
                          Assigner un coursier
                        </div>
                        {loadingCouriers ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" /> Chargement des coursiers...
                          </div>
                        ) : couriers.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Aucun coursier enregistré</p>
                        ) : (
                          <>
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
                            <Button
                              onClick={handleAssignCourier}
                              disabled={!selectedCourierId || assigning}
                              className="w-full gap-2"
                              size="sm"
                            >
                              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                              {assigning ? 'Assignation...' : 'Assigner'}
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status History Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Historique des statuts
                </CardTitle>
                <CardDescription>Chronologie complète de la mission</CardDescription>
              </CardHeader>
              <CardContent>
                {statusHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Aucun historique disponible</p>
                ) : (
                  <div className="relative">
                    {[...statusHistory].reverse().map((entry, index) => {
                      const config = statusConfig[entry.status] || statusConfig.pending;
                      const isFirst = index === 0;
                      const isLast = index === statusHistory.length - 1;

                      return (
                        <motion.div
                          key={`${entry.status}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative flex gap-3 pb-6 last:pb-0"
                        >
                          {/* Line */}
                          {!isLast && (
                            <div className="absolute left-[15px] top-8 w-0.5 h-[calc(100%-16px)] bg-border" />
                          )}

                          {/* Dot */}
                          <div className={cn(
                            "relative z-10 shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center",
                            isFirst
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground"
                          )}>
                            {isFirst ? statusIcons[entry.status] || <Check className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                          </div>

                          {/* Content */}
                          <div className="flex-1 pt-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn("font-medium text-sm", isFirst ? "text-foreground" : "text-muted-foreground")}>
                                {config.label}
                              </span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTs(entry.timestamp)}
                              </span>
                            </div>
                            {entry.note && (
                              <p className="text-xs text-muted-foreground mt-0.5">{entry.note}</p>
                            )}
                            {entry.performedBy && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Par : {entry.performedBy.slice(0, 12)}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
