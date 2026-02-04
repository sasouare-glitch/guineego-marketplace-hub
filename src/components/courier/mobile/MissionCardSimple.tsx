import { MapPin, Package, Clock, Phone, Navigation, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SimpleMission {
  id: string;
  pickupArea: string;
  deliveryArea: string;
  packages: number;
  price: number;
  priority: "standard" | "urgent" | "express";
  status: "available" | "accepted" | "picked_up" | "in_transit" | "delivered";
  customerPhone?: string;
}

interface MissionCardSimpleProps {
  mission: SimpleMission;
  onAccept?: () => void;
  onReject?: () => void;
  onCall?: () => void;
  onNavigate?: () => void;
  onDeliver?: () => void;
}

const priorityStyles = {
  standard: "bg-muted border-muted-foreground/20",
  urgent: "bg-guinea-yellow/10 border-guinea-yellow",
  express: "bg-guinea-red/10 border-guinea-red",
};

const priorityLabels = {
  standard: { text: "NORMAL", color: "text-muted-foreground bg-muted" },
  urgent: { text: "URGENT", color: "text-guinea-yellow bg-guinea-yellow/20" },
  express: { text: "EXPRESS", color: "text-guinea-red bg-guinea-red/20" },
};

export const MissionCardSimple = ({
  mission,
  onAccept,
  onReject,
  onCall,
  onNavigate,
  onDeliver,
}: MissionCardSimpleProps) => {
  const isAvailable = mission.status === "available";
  const isActive = ["accepted", "picked_up", "in_transit"].includes(mission.status);

  return (
    <div
      className={cn(
        "rounded-3xl border-2 p-5 space-y-4 transition-all",
        priorityStyles[mission.priority]
      )}
    >
      {/* Priority Badge */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "px-4 py-2 rounded-full text-sm font-black",
            priorityLabels[mission.priority].color
          )}
        >
          {priorityLabels[mission.priority].text}
        </span>
        <span className="text-2xl font-black text-guinea-green">
          {mission.price.toLocaleString()} GNF
        </span>
      </div>

      {/* Route Info - Visual */}
      <div className="space-y-3">
        {/* Pickup */}
        <div className="flex items-center gap-4 p-4 bg-guinea-green/10 rounded-2xl">
          <div className="w-12 h-12 bg-guinea-green rounded-full flex items-center justify-center">
            <MapPin className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-bold">RÉCUPÉRER À</p>
            <p className="text-xl font-black">{mission.pickupArea}</p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl">↓</span>
          </div>
        </div>

        {/* Delivery */}
        <div className="flex items-center gap-4 p-4 bg-guinea-red/10 rounded-2xl">
          <div className="w-12 h-12 bg-guinea-red rounded-full flex items-center justify-center">
            <MapPin className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-bold">LIVRER À</p>
            <p className="text-xl font-black">{mission.deliveryArea}</p>
          </div>
        </div>
      </div>

      {/* Packages Count */}
      <div className="flex items-center gap-3 p-3 bg-muted rounded-2xl">
        <Package className="w-8 h-8 text-guinea-yellow" strokeWidth={2.5} />
        <span className="text-xl font-black">{mission.packages} COLIS</span>
      </div>

      {/* Actions */}
      {isAvailable && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onReject}
            variant="outline"
            className="h-16 rounded-2xl text-lg font-black border-2 border-guinea-red text-guinea-red hover:bg-guinea-red hover:text-white"
          >
            <XCircle className="w-7 h-7 mr-2" strokeWidth={2.5} />
            REFUSER
          </Button>
          <Button
            onClick={onAccept}
            className="h-16 rounded-2xl text-lg font-black bg-guinea-green hover:bg-guinea-green/90"
          >
            <CheckCircle2 className="w-7 h-7 mr-2" strokeWidth={2.5} />
            ACCEPTER
          </Button>
        </div>
      )}

      {isActive && (
        <div className="grid grid-cols-2 gap-3">
          {mission.customerPhone && (
            <Button
              onClick={onCall}
              variant="outline"
              className="h-16 rounded-2xl text-lg font-black border-2 border-guinea-yellow text-guinea-yellow hover:bg-guinea-yellow hover:text-white"
            >
              <Phone className="w-7 h-7 mr-2" strokeWidth={2.5} />
              APPELER
            </Button>
          )}
          <Button
            onClick={onNavigate}
            className="h-16 rounded-2xl text-lg font-black bg-primary hover:bg-primary/90"
          >
            <Navigation className="w-7 h-7 mr-2" strokeWidth={2.5} />
            GPS
          </Button>
          {mission.status === "in_transit" && (
            <Button
              onClick={onDeliver}
              className="h-16 rounded-2xl text-lg font-black bg-guinea-green hover:bg-guinea-green/90 col-span-2"
            >
              <CheckCircle2 className="w-7 h-7 mr-2" strokeWidth={2.5} />
              LIVRÉ ✓
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
