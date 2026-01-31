import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Check, RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderTimeline, defaultOrderSteps } from "@/components/orders/OrderTimeline";
import { OrderStatusCard } from "@/components/orders/OrderStatusCard";
import { OrderItemsList } from "@/components/orders/OrderItemsList";
import { toast } from "sonner";

// Mock order data
const mockOrder = {
  id: "GGO-12345678",
  status: "picked" as const,
  createdAt: "2024-01-15T10:30:00",
  estimatedDelivery: "14:00 - 16:00",
  address: {
    name: "Mamadou Diallo",
    street: "Quartier Almamya, Rue KA-020",
    commune: "Kaloum",
    city: "Conakry",
    phone: "+224 622 123 456",
  },
  courier: {
    name: "Ibrahima Sow",
    phone: "+224 628 987 654",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    rating: 4.8,
  },
  currentLocation: "Marché Madina",
  items: [
    {
      id: "1",
      name: "iPhone 15 Pro Max",
      quantity: 1,
      price: 18500000,
      image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200",
      variant: "256 Go - Noir",
    },
    {
      id: "2",
      name: "Coque de protection",
      quantity: 2,
      price: 150000,
      image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=200",
    },
  ],
  subtotal: 18800000,
  deliveryFee: 25000,
  total: 18825000,
  paymentMethod: "Orange Money",
};

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const orderId = id || mockOrder.id;

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    toast.success("Numéro de commande copié");
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshStatus = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLastUpdate(new Date());
    setIsRefreshing(false);
    toast.success("Statut mis à jour");
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-tight pt-24 pb-16">
        {/* Back Link */}
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au marketplace
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <OrderStatusCard
              status={mockOrder.status}
              estimatedTime={mockOrder.estimatedDelivery}
              courier={mockOrder.courier}
              currentLocation={mockOrder.currentLocation}
            />

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progression de la livraison</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderTimeline steps={defaultOrderSteps} />
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adresse de livraison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{mockOrder.address.name}</p>
                  <p className="text-muted-foreground">{mockOrder.address.street}</p>
                  <p className="text-muted-foreground">
                    {mockOrder.address.commune}, {mockOrder.address.city}
                  </p>
                  <p className="text-muted-foreground">{mockOrder.address.phone}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Items */}
            <OrderItemsList
              items={mockOrder.items}
              subtotal={mockOrder.subtotal}
              deliveryFee={mockOrder.deliveryFee}
              total={mockOrder.total}
            />

            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date de commande</span>
                  <span className="text-foreground">{formatDate(mockOrder.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paiement</span>
                  <span className="text-foreground">{mockOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livraison estimée</span>
                  <span className="text-foreground">{mockOrder.estimatedDelivery}</span>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Un problème avec votre commande ?
                </p>
                <Button variant="outline" className="w-full">
                  Contacter le support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
