import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Package, 
  Search, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Plane, 
  Ship, 
  Truck,
  Warehouse,
  FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrackingEvent {
  id: string;
  status: string;
  location: string;
  date: string;
  time: string;
  icon: React.ElementType;
  completed: boolean;
  current?: boolean;
}

interface ShipmentTrackerProps {
  initialTrackingNumber?: string;
}

const mockTrackingData = {
  trackingNumber: "GGT-2024-08956",
  status: "in_transit",
  origin: "Guangzhou, Chine",
  destination: "Conakry, Guinée",
  method: "sea",
  estimatedArrival: "15 Février 2024",
  weight: "150 kg",
  events: [
    {
      id: "1",
      status: "Colis réceptionné",
      location: "Entrepôt Guangzhou, Chine",
      date: "10 Jan 2024",
      time: "14:30",
      icon: Warehouse,
      completed: true,
    },
    {
      id: "2",
      status: "En cours de consolidation",
      location: "Entrepôt Guangzhou, Chine",
      date: "12 Jan 2024",
      time: "09:15",
      icon: Package,
      completed: true,
    },
    {
      id: "3",
      status: "Dédouanement export",
      location: "Port de Guangzhou, Chine",
      date: "15 Jan 2024",
      time: "11:00",
      icon: FileCheck,
      completed: true,
    },
    {
      id: "4",
      status: "Chargé sur le navire",
      location: "Port de Guangzhou, Chine",
      date: "18 Jan 2024",
      time: "08:00",
      icon: Ship,
      completed: true,
    },
    {
      id: "5",
      status: "En transit maritime",
      location: "Océan Atlantique",
      date: "25 Jan 2024",
      time: "00:00",
      icon: Ship,
      completed: false,
      current: true,
    },
    {
      id: "6",
      status: "Arrivée au port",
      location: "Port de Conakry, Guinée",
      date: "-",
      time: "-",
      icon: MapPin,
      completed: false,
    },
    {
      id: "7",
      status: "Dédouanement import",
      location: "Douane de Conakry",
      date: "-",
      time: "-",
      icon: FileCheck,
      completed: false,
    },
    {
      id: "8",
      status: "Livraison",
      location: "Conakry, Guinée",
      date: "-",
      time: "-",
      icon: Truck,
      completed: false,
    },
  ] as TrackingEvent[],
};

export const ShipmentTracker = ({ initialTrackingNumber }: ShipmentTrackerProps) => {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber || "");
  const [tracking, setTracking] = useState(initialTrackingNumber ? mockTrackingData : null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!trackingNumber.trim()) return;
    
    setIsSearching(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setTracking(mockTrackingData);
    setIsSearching(false);
  };

  const statusConfig = {
    pending: { label: "En attente", color: "bg-guinea-yellow/10 text-guinea-yellow" },
    in_transit: { label: "En transit", color: "bg-blue-500/10 text-blue-500" },
    customs: { label: "Dédouanement", color: "bg-purple-500/10 text-purple-500" },
    delivered: { label: "Livré", color: "bg-guinea-green/10 text-guinea-green" },
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-guinea-red/10 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6 text-guinea-red" />
          </div>
          <div>
            <h2 className="font-display font-bold text-foreground">Suivi de colis</h2>
            <p className="text-sm text-muted-foreground">Entrez votre numéro de suivi</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Ex: GGT-2024-08956"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isSearching}
            className="bg-guinea-red hover:bg-guinea-red/90"
          >
            {isSearching ? "Recherche..." : "Suivre"}
          </Button>
        </div>
      </motion.div>

      {/* Tracking Result */}
      {tracking && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Shipment Info */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono font-bold text-foreground">{tracking.trackingNumber}</span>
                  <Badge className={statusConfig[tracking.status as keyof typeof statusConfig].color}>
                    {statusConfig[tracking.status as keyof typeof statusConfig].label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {tracking.origin} → {tracking.destination}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Transport</p>
                  <div className="flex items-center gap-1">
                    <Ship className="w-4 h-4 text-guinea-red" />
                    <span className="font-medium">Maritime</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Poids</p>
                  <p className="font-medium">{tracking.weight}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Arrivée estimée</p>
                  <p className="font-medium text-guinea-green">{tracking.estimatedArrival}</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative mb-8">
              <div className="h-2 bg-secondary rounded-full">
                <div 
                  className="h-2 bg-guinea-green rounded-full transition-all"
                  style={{ width: "55%" }}
                />
              </div>
              <div className="absolute -top-1 left-0 right-0 flex justify-between">
                {["🇨🇳", "📦", "🚢", "🇬🇳"].map((emoji, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-xs",
                      i <= 2 ? "bg-guinea-green" : "bg-secondary"
                    )}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              
              {tracking.events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative flex gap-4 pb-6 last:pb-0"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center z-10",
                    event.completed 
                      ? "bg-guinea-green text-white" 
                      : event.current 
                        ? "bg-blue-500 text-white animate-pulse" 
                        : "bg-secondary border-2 border-border"
                  )}>
                    <event.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={cn(
                          "font-medium",
                          event.completed || event.current ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {event.status}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className={event.completed || event.current ? "text-foreground" : "text-muted-foreground"}>
                          {event.date}
                        </p>
                        <p className="text-muted-foreground">{event.time}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
