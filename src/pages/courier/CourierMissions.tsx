import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CourierLayout } from "@/components/courier/CourierLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  MapPin,
  Package,
  Clock,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCourierMissions, DeliveryMission } from "@/hooks/useCourierMissions";
import { cn } from "@/lib/utils";

const priorityConfig = {
  normal: { label: "Standard", className: "bg-muted text-muted-foreground" },
  express: { label: "EXPRESS", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  pickup_started: "En route pickup",
  picked_up: "Colis récupéré",
  in_transit: "En livraison",
  arrived: "Arrivé",
  delivered: "Livrée",
};

const formatPrice = (p: number) => p.toLocaleString("fr-GN") + " GNF";

function MissionRealCard({
  mission,
  onAccept,
  onViewDetails,
}: {
  mission: DeliveryMission;
  onAccept?: () => void;
  onViewDetails: () => void;
}) {
  const priority = priorityConfig[mission.priority] || priorityConfig.normal;
  const isAvailable = mission.status === "pending";

  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-300 border-border bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs font-semibold", priority.className)}>
            {priority.label}
          </Badge>
          {!isAvailable && (
            <Badge className="text-xs bg-primary/10 text-primary">
              {statusLabels[mission.status] || mission.status}
            </Badge>
          )}
        </div>
        <span className="font-display font-bold text-lg text-guinea-green">
          {formatPrice(mission.fee)}
        </span>
      </div>

      {/* Route */}
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
          <div className="w-6 flex justify-center">
            <div className="w-0.5 h-4 bg-border" />
          </div>
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

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{mission.estimatedTime} min</span>
        </div>
        <div className="flex items-center gap-1">
          <Package className="w-4 h-4" />
          <span>Réf: {mission.orderId.slice(0, 16)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {isAvailable && onAccept && (
          <Button onClick={onAccept} className="flex-1 bg-guinea-green hover:bg-guinea-green/90">
            Accepter
          </Button>
        )}
        <Button variant="outline" onClick={onViewDetails} className={cn(!isAvailable && "flex-1")}>
          Détails
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

const CourierMissions = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { available, myMissions, loading, acceptMission } = useCourierMissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("available");

  const handleAcceptMission = async (missionId: string) => {
    await acceptMission(missionId);
    setActiveTab("active");
  };
  const [zoneFilter, setZoneFilter] = useState("all");

  const filterBySearch = (missions: DeliveryMission[]) =>
    missions.filter((m) => {
      const matchesSearch =
        !searchTerm ||
        m.pickup.commune.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.delivery.commune.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.orderId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesZone =
        zoneFilter === "all" ||
        m.pickup.commune.toLowerCase() === zoneFilter.toLowerCase() ||
        m.delivery.commune.toLowerCase() === zoneFilter.toLowerCase();
      return matchesSearch && matchesZone;
    });

  const activeMissions = filterBySearch(
    myMissions.filter((m) => m.status !== "delivered" && m.status !== "cancelled")
  );
  const completedMissions = filterBySearch(
    myMissions.filter((m) => m.status === "delivered")
  );
  const filteredAvailable = filterBySearch(available);

  return (
    <CourierLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Missions</h1>
          <p className="text-muted-foreground">Gérez vos livraisons</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par zone ou réf..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Toutes les zones" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Toutes les zones</SelectItem>
              <SelectItem value="kaloum">Kaloum</SelectItem>
              <SelectItem value="matam">Matam</SelectItem>
              <SelectItem value="dixinn">Dixinn</SelectItem>
              <SelectItem value="ratoma">Ratoma</SelectItem>
              <SelectItem value="matoto">Matoto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="available" className="gap-2">
                Disponibles
                <span className="bg-guinea-green/20 text-guinea-green text-xs px-2 py-0.5 rounded-full">
                  {filteredAvailable.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-2">
                En cours
                <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full">
                  {activeMissions.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="completed">Terminées</TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAvailable.map((mission) => (
                  <MissionRealCard
                    key={mission.id}
                    mission={mission}
                    onAccept={hasRole('courier') ? () => acceptMission(mission.id) : undefined}
                    onViewDetails={() => navigate(`/courier/mission/${mission.id}`)}
                  />
                ))}
              </div>
              {filteredAvailable.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune mission disponible pour le moment</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeMissions.map((mission) => (
                  <MissionRealCard
                    key={mission.id}
                    mission={mission}
                    onViewDetails={() => navigate(`/courier/mission/${mission.id}`)}
                  />
                ))}
              </div>
              {activeMissions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Aucune mission en cours</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedMissions.map((mission) => (
                  <MissionRealCard
                    key={mission.id}
                    mission={mission}
                    onViewDetails={() => navigate(`/courier/mission/${mission.id}`)}
                  />
                ))}
              </div>
              {completedMissions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune mission terminée</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </CourierLayout>
  );
};

export default CourierMissions;
