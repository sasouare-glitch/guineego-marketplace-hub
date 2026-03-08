/**
 * Admin Order Detail Page
 * Full order information with admin actions
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, Loader2,
  MessageSquare, MapPin, Phone, User, CreditCard, Store, Copy, Check, ExternalLink,
  ChefHat, ShoppingBag, History,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { useRealtimeOrder, type OrderStatus, type Order as BaseOrder } from '@/hooks/useRealtimeOrder';
import { OrderTimeline, buildTimelineSteps } from '@/components/orders/OrderTimeline';
import { useCurrency } from '@/hooks/useCurrency';
import { updateDocument } from '@/lib/firebase/mutations';
import { callFunction } from '@/lib/firebase/config';
import { doc, getDoc, arrayUnion, Timestamp as FsTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; color: string }> = {
  pending: { label: 'En attente', variant: 'secondary', icon: Clock, color: 'text-yellow-600' },
  confirmed: { label: 'Confirmée', variant: 'default', icon: CheckCircle, color: 'text-blue-600' },
  preparing: { label: 'En préparation', variant: 'outline', icon: ChefHat, color: 'text-orange-600' },
  ready: { label: 'Prête', variant: 'outline', icon: ShoppingBag, color: 'text-purple-600' },
  shipped: { label: 'Expédiée', variant: 'outline', icon: Package, color: 'text-indigo-600' },
  in_delivery: { label: 'En livraison', variant: 'outline', icon: Truck, color: 'text-blue-600' },
  delivered: { label: 'Livrée', variant: 'default', icon: CheckCircle, color: 'text-green-600' },
  cancelled: { label: 'Annulée', variant: 'destructive', icon: XCircle, color: 'text-destructive' },
  refunded: { label: 'Remboursée', variant: 'destructive', icon: XCircle, color: 'text-destructive' },
};

const allStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'shipped', 'in_delivery', 'delivered', 'cancelled'];

const paymentMethodLabels: Record<string, string> = {
  orange_money: 'Orange Money',
  mtn_money: 'MTN Money',
  card: 'Carte bancaire',
  wallet: 'Portefeuille',
  cash: 'Espèces',
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { format } = useCurrency();
  const { order: rawOrder, loading, error, currentStatus, statusHistory } = useRealtimeOrder(id);
  const order = rawOrder as (BaseOrder & { orderNumber?: string }) | null;

  const [copied, setCopied] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [resendingSms, setResendingSms] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({});
  const [customerInfo, setCustomerInfo] = useState<{ name: string; email: string } | null>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // Load seller names & customer info
  useEffect(() => {
    if (!order) return;

    const loadExtra = async () => {
      // Customer
      if (order.customerId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', order.customerId));
          if (userDoc.exists()) {
            const d = userDoc.data();
            setCustomerInfo({ name: d.displayName || d.fullName || '', email: d.email || '' });
          }
        } catch {}
      }

      // Sellers
      const ids = order.sellerIds || [];
      const names: Record<string, string> = {};
      for (const sid of ids) {
        try {
          const [settingsDoc, sellerDoc] = await Promise.all([
            getDoc(doc(db, 'seller_settings', sid)),
            getDoc(doc(db, 'sellers', sid)),
          ]);
          if (settingsDoc.exists() && settingsDoc.data().shopName) {
            names[sid] = settingsDoc.data().shopName;
          } else if (sellerDoc.exists()) {
            const d = sellerDoc.data();
            names[sid] = d.shopName || d.businessName || d.displayName || sid.slice(0, 8);
          } else {
            names[sid] = sid.slice(0, 8);
          }
        } catch {
          names[sid] = sid.slice(0, 8);
        }
      }
      setSellerNames(names);
    };

    loadExtra();
  }, [order]);

  // Resolve user names from statusHistory performedBy UIDs
  useEffect(() => {
    if (!statusHistory || statusHistory.length === 0) return;
    const uids = [...new Set(statusHistory.map(e => e.performedBy).filter(Boolean))] as string[];
    const unknown = uids.filter(uid => !userNames[uid]);
    if (unknown.length === 0) return;

    const load = async () => {
      const names: Record<string, string> = {};
      await Promise.all(unknown.map(async (uid) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const d = userDoc.data();
            names[uid] = d.displayName || d.fullName || d.email || uid.slice(0, 8);
          } else {
            names[uid] = uid.slice(0, 8);
          }
        } catch {
          names[uid] = uid.slice(0, 8);
        }
      }));
      setUserNames(prev => ({ ...prev, ...names }));
    };
    load();
  }, [statusHistory]);

  const copyId = () => {
    navigator.clipboard.writeText(id || '');
    setCopied(true);
    toast.success('ID copié');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateStatus = async () => {
    if (!newStatus || !id) return;
    setSaving(true);
    try {
      await updateDocument('orders', id, { status: newStatus });
      toast.success(`Statut mis à jour → ${statusConfig[newStatus]?.label || newStatus}`);
      setNewStatus('');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateDocument('orders', id, { status: 'cancelled' });
      toast.success('Commande annulée');
      setCancelDialogOpen(false);
    } catch {
      toast.error("Erreur lors de l'annulation");
    } finally {
      setSaving(false);
    }
  };

  const handleResendSms = async () => {
    if (!id) return;
    setResendingSms(true);
    try {
      const resend = callFunction<{ orderId: string }, { success: boolean; message: string }>('resendOrderSms');
      const result = await resend({ orderId: id });
      toast.success(result.data.message || 'SMS renvoyé avec succès');
    } catch (err: any) {
      toast.error(err?.message || 'Échec du renvoi SMS');
    } finally {
      setResendingSms(false);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const orderStatus = currentStatus || 'pending';
  const status = statusConfig[orderStatus] || statusConfig.pending;
  const StatusIcon = status.icon;

  const timelineSteps = order ? buildTimelineSteps(orderStatus as OrderStatus, statusHistory, order.createdAt) : [];
  const address = order?.shippingAddress;
  const pricing = order?.pricing;
  const items = order?.items || [];

  if (loading) {
    return (
      <AdminLayout title="Chargement..." description="">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout title="Commande introuvable" description="">
        <div className="text-center py-20">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground mb-4">La commande {id} n'existe pas.</p>
          <Button onClick={() => navigate('/admin/orders')}>Retour aux commandes</Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Commande ${order.orderNumber || id?.slice(0, 12)}`} description="Détail complet de la commande">
      <div className="space-y-6">
        {/* Back + Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux commandes
          </button>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant} className="gap-1 text-sm px-3 py-1">
              <StatusIcon className="w-4 h-4" />
              {status.label}
            </Badge>
            <button
              onClick={copyId}
              className="inline-flex items-center gap-1 font-mono text-sm text-primary hover:underline"
            >
              {order.orderNumber || id}
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Banner */}
            {orderStatus === 'cancelled' && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="font-medium text-destructive">Commande annulée</p>

                  <p className="text-sm text-muted-foreground">{order.cancellationReason || 'Aucune raison spécifiée'}</p>
                </div>
              </div>
            )}

            {orderStatus === 'delivered' && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="font-medium text-primary">Commande livrée avec succès</p>
              </div>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progression</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderTimeline steps={timelineSteps} />
              </CardContent>
            </Card>

            {/* Status History / Audit Trail */}
            {statusHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Historique des changements de statut
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {[...statusHistory].reverse().map((entry, i) => {
                      const entryStatus = statusConfig[entry.status] || statusConfig.pending;
                      const EntryIcon = entryStatus.icon;
                      const ts = entry.timestamp;
                      const date = ts?.toDate ? ts.toDate() : ts ? new Date(ts as any) : null;
                      const formattedDate = date
                        ? date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—';
                      const formattedTime = date
                        ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : '';
                      const performer = entry.performedBy ? (userNames[entry.performedBy] || entry.performedBy.slice(0, 8)) : null;

                      return (
                        <div key={i} className="flex gap-3 pb-4 last:pb-0">
                          {/* Icon */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted ${entryStatus.color}`}>
                            <EntryIcon className="w-4 h-4" />
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant={entryStatus.variant} className="text-xs">
                                {entryStatus.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formattedDate} {formattedTime}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              {performer && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {performer}
                                </span>
                              )}
                              {entry.role && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {entry.role}
                                </Badge>
                              )}
                            </div>
                            {entry.note && (
                              <p className="mt-1 text-xs text-muted-foreground italic">
                                📝 {entry.note}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Articles ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="w-12 h-12 rounded-md bg-muted overflow-hidden flex-shrink-0">
                        <img
                          src={item.thumbnail || '/placeholder.svg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qté: {item.quantity} × {format(item.price)}
                          {item.variantSku && <span className="ml-2 text-xs">({item.variantSku})</span>}
                        </p>
                      </div>
                      <p className="font-medium text-foreground whitespace-nowrap">{format(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {pricing && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sous-total</span>
                        <span>{format(pricing.subtotal || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Livraison</span>
                        <span>{format(pricing.shippingFee || 0)}</span>
                      </div>
                      {pricing.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Réduction</span>
                          <span>-{format(pricing.discount)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">{format(pricing.total || 0)}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Sellers Breakdown */}
            {order.sellers && Object.keys(order.sellers).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Vendeurs impliqués
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(order.sellers).map(([sellerId, sellerData]: [string, any]) => (
                      <div key={sellerId} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <Link
                            to={`/admin/sellers?highlight=${sellerId}`}
                            className="font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            {sellerNames[sellerId] || sellerId.slice(0, 8)}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          <span className="font-medium">{format(sellerData.subtotal || 0)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {sellerData.items?.length || 0} article(s)
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Admin Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Update Status */}
                {orderStatus !== 'cancelled' && orderStatus !== 'delivered' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Changer le statut</label>
                    <div className="flex gap-2">
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Nouveau statut" />
                        </SelectTrigger>
                        <SelectContent>
                          {allStatuses
                            .filter(s => s !== orderStatus)
                            .map(s => (
                              <SelectItem key={s} value={s}>
                                {statusConfig[s]?.label || s}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleUpdateStatus} disabled={!newStatus || saving} size="sm">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'OK'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Resend SMS */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResendSms}
                  disabled={resendingSms}
                >
                  {resendingSms ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4 mr-2" />
                  )}
                  Renvoyer SMS
                </Button>

                {/* View client tracking */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/order/${id}`)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Voir page suivi client
                </Button>

                {/* Cancel */}
                {orderStatus !== 'cancelled' && orderStatus !== 'delivered' && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Annuler la commande
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {customerInfo?.name || address?.fullName || order.customerId?.slice(0, 8) || '—'}
                  </span>
                </div>
                {customerInfo?.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{customerInfo.email}</span>
                  </div>
                )}
                {address?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{address.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Adresse de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                {address ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-foreground">{address.fullName}</p>
                    <p className="text-muted-foreground">{address.address || '—'}</p>
                    <p className="text-muted-foreground">
                      {address.commune}{address.quartier ? `, ${address.quartier}` : ''}
                    </p>
                    <p className="text-muted-foreground">{address.phone}</p>
                    {address.instructions && (
                      <p className="text-muted-foreground italic mt-2">📝 {address.instructions}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune adresse</p>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Méthode</span>
                  <span className="text-foreground">{paymentMethodLabels[order.paymentMethod] || order.paymentMethod || '—'}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Statut paiement</span>
                  <Badge variant={order.paymentStatus === 'paid' ? 'default' : order.paymentMethod === 'cash' ? 'outline' : 'secondary'}>
                    {order.paymentStatus === 'paid' ? 'Payé'
                      : order.paymentStatus === 'refunded' ? 'Remboursé'
                      : order.paymentStatus === 'failed' ? 'Échoué'
                      : order.paymentMethod === 'cash' ? 'Cash à la livraison'
                      : 'En attente'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Montant</span>
                  <span className="font-bold text-foreground">{format(pricing?.total || 0)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Order Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Métadonnées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Créée le</span>
                  <span className="text-foreground">{formatDate(order.createdAt)}</span>
                </div>
                {order.deliveryMissionId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mission livraison</span>
                    <Link
                      to={`/admin/deliveries/${order.deliveryMissionId}`}
                      className="text-primary hover:underline font-mono text-xs"
                    >
                      {order.deliveryMissionId.slice(0, 12)}…
                    </Link>
                  </div>
                )}
                {order.assignedCourier && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Coursier</span>
                    <span className="font-mono text-xs text-foreground">{order.assignedCourier.slice(0, 12)}…</span>
                  </div>
                )}
                {order.couponCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Code promo</span>
                    <Badge variant="outline">{order.couponCode}</Badge>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ID Firestore</span>
                  <span className="font-mono text-xs text-muted-foreground">{id}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              La commande {order.orderNumber || id} sera définitivement annulée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, garder</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Oui, annuler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
