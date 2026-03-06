import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Check, RefreshCw, XCircle, Loader2, Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderTimeline, buildTimelineSteps } from "@/components/orders/OrderTimeline";
import { OrderStatusCard } from "@/components/orders/OrderStatusCard";
import { toast } from "sonner";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";

const paymentMethodLabels: Record<string, string> = {
  orange_money: "Orange Money",
  mtn_money: "MTN Money",
  card: "Carte bancaire",
  wallet: "Portefeuille",
  cash: "Espèces",
};

export default function PublicOrderTrackingPage() {
  const { id } = useParams();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const orderId = id || "";
  const { order, loading, currentStatus, statusHistory, estimatedDelivery } = useRealtimeOrder(orderId);
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

  useEffect(() => {
    const interval = setInterval(() => setLastUpdate(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date: any) => {
    if (!date) return "—";
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const timelineSteps = buildTimelineSteps(orderStatus as any, statusHistory, order?.createdAt);

  const estimatedTimeStr = estimatedDelivery
    ? estimatedDelivery.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : undefined;

  const address = order?.shippingAddress;
  const itemCount = order?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Chargement du suivi...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <Package className="w-16 h-16 text-muted-foreground mx-auto" />
            <h1 className="text-xl font-bold text-foreground">Commande introuvable</h1>
            <p className="text-muted-foreground text-sm">
              La commande <span className="font-mono font-semibold">{orderId}</span> n'existe pas ou le lien est invalide.
            </p>
            <Link to="/marketplace">
              <Button className="mt-2">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Visiter GuineeGo
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal branded header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">G</span>
            </div>
            <span className="font-display font-bold text-foreground">GuineeGo</span>
          </Link>
          <Badge variant="outline" className="text-xs">
            Suivi public
          </Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Order ID & refresh */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">
                📦 Suivi de commande
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">N°</span>
                <button
                  onClick={copyOrderId}
                  className="inline-flex items-center gap-1 font-mono font-semibold text-sm text-primary hover:underline"
                >
                  {orderId}
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={refreshStatus} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString("fr-FR")}
          </p>
        </motion.div>

        {/* Cancelled Banner */}
        {orderStatus === "cancelled" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3"
          >
            <XCircle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">Commande annulée</p>
              <p className="text-sm text-muted-foreground">
                {order.cancellationReason || "Le remboursement sera effectué sous 24-48h."}
              </p>
            </div>
          </motion.div>
        )}

        {/* Delivered Banner */}
        {orderStatus === "delivered" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="font-medium text-green-600">Commande livrée ✅</p>
              <p className="text-sm text-muted-foreground">
                Votre commande a été livrée avec succès. Merci !
              </p>
            </div>
          </motion.div>
        )}

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
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline steps={timelineSteps} />
          </CardContent>
        </Card>

        {/* Summary row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Order Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Articles</span>
                <span className="text-foreground font-medium">{itemCount} article{itemCount > 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="text-foreground font-bold">{(order.pricing?.total || 0).toLocaleString("fr-FR")} GNF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paiement</span>
                <span className="text-foreground">{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut paiement</span>
                <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"} className="text-xs">
                  {order.paymentStatus === "paid" ? "Payé" : "En attente"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address (masked for privacy) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Livraison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium text-foreground">{address?.fullName || "—"}</p>
              <p className="text-muted-foreground">{address?.commune || "—"}{address?.quartier ? `, ${address.quartier}` : ""}</p>
              <p className="text-muted-foreground">{address?.phone ? `${address.phone.slice(0, 5)}****` : "—"}</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
            <p className="text-sm text-muted-foreground">
              Besoin d'aide ? Connectez-vous pour plus d'options.
            </p>
            <div className="flex gap-2">
              <Link to={`/order/${orderId}`}>
                <Button variant="outline" size="sm">Se connecter</Button>
              </Link>
              <Link to="/marketplace">
                <Button size="sm">
                  <ShoppingBag className="w-4 h-4 mr-1" />
                  Marketplace
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Minimal footer */}
      <footer className="border-t mt-8 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} GuineeGo — Tous droits réservés
      </footer>
    </div>
  );
}
