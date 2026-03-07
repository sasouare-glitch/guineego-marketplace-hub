import { CourierLayout } from "@/components/courier/CourierLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Package, Clock, ChevronRight, Loader2, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCourierMissions, DeliveryMission } from "@/hooks/useCourierMissions";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  accepted: "Acceptée",
  pickup_started: "En route pickup",
  picked_up: "Colis récupéré",
  in_transit: "En livraison",
  arrived: "Arrivé",
};

const statusColors: Record<string, string> = {
  accepted: "bg-primary/10 text-primary",
  pickup_started: "bg-guinea-yellow/10 text-guinea-yellow",
  picked_up: "bg-guinea-yellow/10 text-guinea-yellow",
  in_transit: "bg-blue-500/10 text-blue-500",
  arrived: "bg-guinea-green/10 text-guinea-green",
};

const formatPrice = (p: number) => p.toLocaleString("fr-GN") + " GNF";

function ActiveMissionCard({ mission, onClick }: { mission: DeliveryMission; onClick: () => void }) {
  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-300 border-border bg-card cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs font-semibold", statusColors[mission.status] || "bg-muted text-muted-foreground")}>
            {statusLabels[mission.status] || mission.status}
          </Badge>
          {mission.priority === "express" && (
            <Badge variant="outline" className="text-xs font-semibold bg-destructive/10 text-destructive border-destructive/20">
              EXPRESS
            </Badge>
          )}
        </div>
        <span className="font-display font-bold text-lg text-guinea-green">{formatPrice(mission.fee)}</span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-guinea-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-guinea-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{mission.pickup.commune}</p>
            <p className="text-xs text-muted-foreground truncate">{mission.pickup.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 flex justify-center"><div className="w-0.5 h-4 bg-border" /></div>
          <div className="flex-1 border-t border-dashed border-border" />
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin className="w-3 h-3 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{mission.delivery.commune}</p>
            <p className="text-xs text-muted-foreground truncate">{mission.delivery.address}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{mission.estimatedTime} min</span>
          <span className="flex items-center gap-1"><Package className="w-4 h-4" />Réf: {mission.orderId.slice(0, 8)}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </Card>
  );
}

const CourierActiveMissions = () => {
  const navigate = useNavigate();
  const { myMissions, loading } = useCourierMissions();

  const activeMissions = myMissions.filter(
    (m) => m.status !== "delivered" && m.status !== "cancelled" && m.status !== "pending"
  );

  return (
    <CourierLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Missions en cours</h1>
          <p className="text-muted-foreground">
            {activeMissions.length} mission{activeMissions.length !== 1 ? "s" : ""} active{activeMissions.length !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : activeMissions.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeMissions.map((mission) => (
              <ActiveMissionCard
                key={mission.id}
                mission={mission}
                onClick={() => navigate(`/courier/mission/${mission.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Truck className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-bold mb-2">Aucune mission en cours</h3>
            <p className="mb-4">Acceptez une mission disponible pour commencer</p>
            <Button onClick={() => navigate("/courier/missions")}>
              Voir les missions disponibles
            </Button>
          </div>
        )}
      </div>
    </CourierLayout>
  );
};

export default CourierActiveMissions;
