import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Check, RefreshCw, XCircle, Loader2, MessageSquare, RotateCcw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderTimeline, buildTimelineSteps } from "@/components/orders/OrderTimeline";
import { OrderStatusCard } from "@/components/orders/OrderStatusCard";
import { OrderItemsList } from "@/components/orders/OrderItemsList";
import { CancelOrderDialog } from "@/components/orders/CancelOrderDialog";
import { CourierTrackingCard } from "@/components/orders/CourierTrackingCard";
import { OrderQRCode } from "@/components/orders/OrderQRCode";
import { toast } from "sonner";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { callFunction } from "@/lib/firebase/config";

const paymentMethodLabels: Record<string, string> = {
  orange_money: "Orange Money",
  mtn_money: "MTN Money",
  card: "Carte bancaire",
  wallet: "Portefeuille",
  cash: "Espèces",
};

export default function OrderTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isCancelling, setIsCancelling] = useState(false);
  const [isResendingSms, setIsResendingSms] = useState(false);

  const { user, claims } = useAuth();
  const isAdmin = claims?.role === 'admin' || (user?.email && ['sasouare@gmail.com'].includes(user.email));
  const orderId = id || "";
  const { order, loading, error, currentStatus, canCancel, statusHistory, estimatedDelivery } = useRealtimeOrder(orderId);

  const orderStatus = currentStatus || "pending";

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    toast.success("Numéro de commande copié");
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshStatus = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLastUpdate(new Date());
    setIsRefreshing(false);
    toast.success("Statut mis à jour");
  };

  const handleCancelOrder = async (reason: string) => {
    setIsCancelling(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsCancelling(false);
    toast.success("Commande annulée", {
      description: "Le remboursement sera effectué sous 24-48h",
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date: any) => {
    if (!date) return "—";
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const items = (order?.items || []).map((item, i) => ({
    id: item.productId || String(i),
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    image: item.thumbnail || "/placeholder.svg",
    variant: item.variantSku || undefined,
  }));

  const pricing = order?.pricing;
  const address = order?.shippingAddress;

  // Build dynamic timeline from real order data
  const timelineSteps = buildTimelineSteps(
    orderStatus as any,
    statusHistory,
    order?.createdAt
  );

  // Format estimated delivery
  const estimatedTimeStr = estimatedDelivery
    ? estimatedDelivery.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-tight pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-tight pt-24 pb-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Commande introuvable</h1>
          <p className="text-muted-foreground mb-6">La commande {orderId} n'existe pas.</p>
          <Link to="/marketplace">
            <Button>Retour au marketplace</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-tight pt-24 pb-16">
        {/* Back Link */}
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Mes commandes
        </Link>

        {/* Order Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                Suivi de commande
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-muted-foreground">Commande</span>
                <button
                  onClick={copyOrderId}
                  className="inline-flex items-center gap-1 font-mono font-semibold text-primary hover:underline"
                >
                  {orderId}
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={refreshStatus}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString("fr-FR")}
          </p>
        </motion.div>

        {/* Cancelled Banner */}
        {orderStatus === "cancelled" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3"
          >
            <XCircle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Commande annulée</p>
              <p className="text-sm text-muted-foreground">
                {order.cancellationReason || "Le remboursement sera effectué sous 24-48h via votre méthode de paiement."}
              </p>
            </div>
          </motion.div>
        )}

        {/* Delivered Banner */}
        {orderStatus === "delivered" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-600">Commande livrée</p>
              <p className="text-sm text-muted-foreground">
                Votre commande a été livrée avec succès. Merci pour votre confiance !
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            {orderStatus !== "cancelled" && (
              <OrderStatusCard
                status={orderStatus as any}
                estimatedTime={estimatedTimeStr}
                courier={undefined}
                currentLocation={undefined}
              />
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progression de la commande</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderTimeline steps={timelineSteps} />
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adresse de livraison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{address?.fullName || "—"}</p>
                  <p className="text-muted-foreground">{address?.address || "—"}</p>
                  <p className="text-muted-foreground">
                    {address?.commune || "—"}{address?.quartier ? `, ${address.quartier}` : ""}
                  </p>
                  <p className="text-muted-foreground">{address?.phone || "—"}</p>
                  {address?.instructions && (
                    <p className="text-sm text-muted-foreground italic mt-2">
                      📝 {address.instructions}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code for delivery confirmation — show when order is shipped/in_delivery */}
            {["shipped", "in_delivery", "arrived"].includes(orderStatus) && (
              <OrderQRCode orderId={orderId} purpose="delivery" />
            )}

            {/* Courier Tracking */}
            {order.deliveryMissionId && (
              <CourierTrackingCard deliveryMissionId={order.deliveryMissionId} />
            )}

            {/* Order Items */}
            <OrderItemsList
              items={items}
              subtotal={pricing?.subtotal || 0}
              deliveryFee={pricing?.shippingFee || 0}
              total={pricing?.total || 0}
            />

            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date de commande</span>
                  <span className="text-foreground">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paiement</span>
                  <span className="text-foreground">{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Statut paiement</span>
                  <Badge variant={order.paymentStatus === 'paid' ? 'default' : order.paymentMethod === 'cash' ? 'outline' : 'secondary'}>
                    {order.paymentStatus === 'paid'
                      ? 'Payé'
                      : order.paymentStatus === 'refunded'
                      ? 'Remboursé'
                      : order.paymentStatus === 'failed'
                      ? 'Échoué'
                      : order.paymentMethod === 'cash'
                      ? 'Cash à la livraison'
                      : 'En attente'}
                  </Badge>
                </div>
                {order.deliveryMissionId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mission livraison</span>
                    <span className="text-primary font-mono text-xs">
                      {order.deliveryMissionId}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardContent className="p-4 space-y-3">
                {/* Admin: Resend SMS */}
                {isAdmin && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isResendingSms}
                    onClick={async () => {
                      setIsResendingSms(true);
                      try {
                        const phone = address?.phone;
                        if (!phone) {
                          toast.error("Aucun numéro de téléphone pour cette commande");
                          return;
                        }
                        const resend = callFunction<
                          { orderId: string },
                          { success: boolean; message: string }
                        >('resendOrderSms');
                        const result = await resend({ orderId });
                        toast.success(result.data.message || "SMS renvoyé avec succès");
                      } catch (err: any) {
                        toast.error(err?.message || "Échec du renvoi SMS");
                      } finally {
                        setIsResendingSms(false);
                      }
                    }}
                  >
                    {isResendingSms ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4 mr-2" />
                    )}
                    Renvoyer SMS
                  </Button>
                )}

                <p className="text-sm text-muted-foreground">
                  Un problème avec votre commande ?
                </p>
                <Button variant="outline" className="w-full">
                  Contacter le support
                </Button>
                
                {canCancel && (
                  <CancelOrderDialog
                    orderNumber={orderId}
                    onCancel={handleCancelOrder}
                    isProcessing={isCancelling}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
