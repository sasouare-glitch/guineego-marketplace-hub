import { MapPin, Package, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Mission {
  id: string;
  pickupAddress: string;
  pickupArea: string;
  deliveryAddress: string;
  deliveryArea: string;
  distance: string;
  packages: number;
  maxTime: string;
  price: number;
  priority: "urgent" | "standard" | "low";
  status: "available" | "accepted" | "pickup" | "in_transit" | "delivered";
  customerName?: string;
  customerPhone?: string;
  shopName?: string;
}

interface MissionCardProps {
  mission: Mission;
  onAccept?: () => void;
  onViewDetails?: () => void;
  showActions?: boolean;
}

const priorityConfig = {
  urgent: {
    label: "URGENT",
    className: "bg-guinea-red/10 text-guinea-red border-guinea-red/20",
  },
  standard: {
    label: "Standard",
    className: "bg-guinea-yellow/10 text-guinea-yellow border-guinea-yellow/20",
  },
  low: {
    label: "Flexible",
    className: "bg-muted text-muted-foreground",
  },
};

const statusConfig = {
  available: { label: "Disponible", className: "bg-guinea-green/10 text-guinea-green" },
  accepted: { label: "Acceptée", className: "bg-primary/10 text-primary" },
  pickup: { label: "Récupération", className: "bg-guinea-yellow/10 text-guinea-yellow" },
  in_transit: { label: "En livraison", className: "bg-blue-500/10 text-blue-500" },
  delivered: { label: "Livrée", className: "bg-guinea-green/10 text-guinea-green" },
};

export const MissionCard = ({ mission, onAccept, onViewDetails, showActions = true }: MissionCardProps) => {
  const priority = priorityConfig[mission.priority];
  const status = statusConfig[mission.status];

  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-300 border-border bg-card">
      {/* Header avec priorité et prix */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs font-semibold", priority.className)}>
            {priority.label}
          </Badge>
          {mission.status !== "available" && (
            <Badge className={cn("text-xs", status.className)}>
              {status.label}
            </Badge>
          )}
        </div>
        <span className="font-display font-bold text-lg text-guinea-green">
          {mission.price.toLocaleString('fr-GN')} GNF
        </span>
      </div>

      {/* Itinéraire */}
      <div className="space-y-2 mb-4">
        {/* Pickup */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-guinea-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-guinea-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{mission.pickupArea}</p>
            <p className="text-xs text-muted-foreground truncate">{mission.pickupAddress}</p>
          </div>
        </div>

        {/* Ligne de connexion */}
        <div className="flex items-center gap-3">
          <div className="w-6 flex justify-center">
            <div className="w-0.5 h-4 bg-border" />
          </div>
          <div className="flex-1 border-t border-dashed border-border" />
        </div>

        {/* Delivery */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-guinea-red/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin className="w-3 h-3 text-guinea-red" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{mission.deliveryArea}</p>
            <p className="text-xs text-muted-foreground truncate">{mission.deliveryAddress}</p>
          </div>
        </div>
      </div>

      {/* Infos */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          <span>{mission.distance}</span>
        </div>
        <div className="flex items-center gap-1">
          <Package className="w-4 h-4" />
          <span>{mission.packages} colis</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{mission.maxTime}</span>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2">
          {mission.status === "available" && onAccept && (
            <Button onClick={onAccept} className="flex-1 bg-guinea-green hover:bg-guinea-green/90">
              Accepter
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={onViewDetails}
            className={cn(mission.status === "available" ? "" : "flex-1")}
          >
            Détails
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </Card>
  );
};
