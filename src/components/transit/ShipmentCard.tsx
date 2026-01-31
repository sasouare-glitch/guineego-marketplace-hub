import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Package, 
  MapPin, 
  Calendar, 
  Ship, 
  Plane, 
  ArrowRight,
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShipmentCardProps {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: "pending" | "in_transit" | "customs" | "delivered";
  method: "air" | "sea";
  weight: string;
  createdAt: string;
  estimatedArrival: string;
  items: string;
}

export const ShipmentCard = ({
  id,
  trackingNumber,
  origin,
  destination,
  status,
  method,
  weight,
  createdAt,
  estimatedArrival,
  items
}: ShipmentCardProps) => {
  const statusConfig = {
    pending: { label: "En attente", color: "bg-guinea-yellow/10 text-guinea-yellow border-guinea-yellow/20" },
    in_transit: { label: "En transit", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    customs: { label: "Dédouanement", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    delivered: { label: "Livré", color: "bg-guinea-green/10 text-guinea-green border-guinea-green/20" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-5 card-hover"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            method === "air" ? "bg-blue-500/10" : "bg-guinea-red/10"
          )}>
            {method === "air" ? (
              <Plane className="w-5 h-5 text-blue-500" />
            ) : (
              <Ship className="w-5 h-5 text-guinea-red" />
            )}
          </div>
          <div>
            <p className="font-mono font-bold text-foreground">{trackingNumber}</p>
            <p className="text-sm text-muted-foreground">{items}</p>
          </div>
        </div>
        <Badge className={statusConfig[status].color}>
          {statusConfig[status].label}
        </Badge>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <span className="text-2xl">🇨🇳</span>
        <span className="text-muted-foreground">{origin}</span>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <span className="text-2xl">🇬🇳</span>
        <span className="text-muted-foreground">{destination}</span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Poids</p>
          <p className="font-medium text-foreground">{weight}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Créé le</p>
          <p className="font-medium text-foreground">{createdAt}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Arrivée estimée</p>
          <p className="font-medium text-guinea-green">{estimatedArrival}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <Button variant="outline" className="flex-1" size="sm" asChild>
          <Link to={`/transit/tracking?id=${trackingNumber}`}>
            <Eye className="w-4 h-4 mr-2" />
            Voir le suivi
          </Link>
        </Button>
        <Button variant="ghost" size="sm">
          <Package className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};
