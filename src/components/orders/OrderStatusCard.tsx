import { motion } from "framer-motion";
import { Package, MapPin, Phone, MessageCircle } from "lucide-react";
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

interface OrderStatusCardProps {
  status: "preparing" | "picked" | "transit" | "delivered";
  estimatedTime?: string;
  courier?: CourierInfo;
  currentLocation?: string;
}

const statusConfig = {
  preparing: {
    label: "En préparation",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    message: "Le vendeur prépare votre commande",
  },
  picked: {
    label: "Colis récupéré",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    message: "Le livreur a récupéré votre colis",
  },
  transit: {
    label: "En livraison",
    color: "bg-primary/10 text-primary border-primary/20",
    message: "Votre colis est en route",
  },
  delivered: {
    label: "Livré",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    message: "Votre commande a été livrée",
  },
};

export function OrderStatusCard({
  status,
  estimatedTime,
  courier,
  currentLocation,
}: OrderStatusCardProps) {
  const config = statusConfig[status];

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
            {estimatedTime && (
              <span className="text-sm font-medium text-foreground">
                Arrivée estimée: {estimatedTime}
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-2">{config.message}</p>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Current Location */}
          {currentLocation && status === "transit" && (
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
          {courier && (status === "picked" || status === "transit") && (
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
          {status === "transit" && (
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
