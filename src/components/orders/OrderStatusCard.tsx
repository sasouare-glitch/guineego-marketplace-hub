import { motion } from "framer-motion";
import { Package, MapPin, Phone, MessageCircle, Clock, CheckCircle, XCircle, Truck, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface CourierInfo {
  name: string;
  phone: string;
  avatar?: string;
  rating: number;
}

type OrderStatusKey =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "shipped"
  | "in_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

interface OrderStatusCardProps {
  status: OrderStatusKey;
  estimatedTime?: string;
  courier?: CourierInfo;
  currentLocation?: string;
}

const statusConfig: Record<OrderStatusKey, { label: string; color: string; message: string; icon: React.ReactNode }> = {
  pending: {
    label: "En attente",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    message: "Votre commande est en attente de confirmation",
    icon: <Clock className="w-5 h-5" />,
  },
  confirmed: {
    label: "Confirmée",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    message: "Votre commande a été confirmée par le vendeur",
    icon: <CheckCircle className="w-5 h-5" />,
  },
  preparing: {
    label: "En préparation",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    message: "Le vendeur prépare votre commande",
    icon: <ShoppingBag className="w-5 h-5" />,
  },
  ready: {
    label: "Prête",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    message: "Votre commande est prête, en attente du coursier",
    icon: <Package className="w-5 h-5" />,
  },
  shipped: {
    label: "Expédiée",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    message: "Le livreur a récupéré votre colis",
    icon: <Package className="w-5 h-5" />,
  },
  in_delivery: {
    label: "En livraison",
    color: "bg-primary/10 text-primary border-primary/20",
    message: "Votre colis est en route vers vous",
    icon: <Truck className="w-5 h-5" />,
  },
  delivered: {
    label: "Livré",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    message: "Votre commande a été livrée avec succès",
    icon: <CheckCircle className="w-5 h-5" />,
  },
  cancelled: {
    label: "Annulée",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    message: "Votre commande a été annulée",
    icon: <XCircle className="w-5 h-5" />,
  },
  refunded: {
    label: "Remboursée",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    message: "Votre commande a été remboursée",
    icon: <XCircle className="w-5 h-5" />,
  },
};

export function OrderStatusCard({
  status,
  estimatedTime,
  courier,
  currentLocation,
}: OrderStatusCardProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const isInTransit = status === "in_delivery" || status === "shipped";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden">
        {/* Status Header */}
        <div className="bg-primary/5 p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={config.color}>
              {config.label}
            </Badge>
            {estimatedTime && status !== "delivered" && status !== "cancelled" && (
              <span className="text-sm font-medium text-foreground">
                Arrivée estimée: {estimatedTime}
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-2">{config.message}</p>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Current Location */}
          {currentLocation && isInTransit && (
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Position actuelle</p>
                <p className="font-medium text-foreground">{currentLocation}</p>
              </div>
            </div>
          )}

          {/* Courier Info */}
          {courier && isInTransit && (
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={courier.avatar} />
                  <AvatarFallback>{courier.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{courier.name}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-amber-500">★</span>
                    <span className="text-sm text-muted-foreground">
                      {courier.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" className="rounded-full">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" className="rounded-full">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Delivery Animation for Transit */}
          {isInTransit && (
            <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-primary rounded-full"
                initial={{ width: "30%" }}
                animate={{ width: "70%" }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
