import { useState } from "react";
import { CourierLayout } from "@/components/courier/CourierLayout";
import { MissionCard, Mission } from "@/components/courier/MissionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const allMissions: Mission[] = [
  {
    id: "1",
    pickupAddress: "Av. République, Imm. 45",
    pickupArea: "Kaloum",
    deliveryAddress: "Quartier Cosa, Villa 12",
    deliveryArea: "Ratoma",
    distance: "4.2 km",
    packages: 2,
    maxTime: "45 min",
    price: 25000,
    priority: "urgent",
    status: "available",
  },
  {
    id: "2",
    pickupAddress: "Centre Commercial",
    pickupArea: "Matam",
    deliveryAddress: "Rue 213, Maison bleue",
    deliveryArea: "Dixinn",
    distance: "2.8 km",
    packages: 1,
    maxTime: "2h",
    price: 15000,
    priority: "standard",
    status: "available",
  },
  {
    id: "3",
    pickupAddress: "Marché Niger",
    pickupArea: "Kaloum",
    deliveryAddress: "Cité des Médecins",
    deliveryArea: "Lambanyi",
    distance: "8.5 km",
    packages: 3,
    maxTime: "1h30",
    price: 45000,
    priority: "urgent",
    status: "available",
  },
  {
    id: "4",
    pickupAddress: "Magasin Central",
    pickupArea: "Madina",
    deliveryAddress: "Résidence Parc",
    deliveryArea: "Kipé",
    distance: "6.1 km",
    packages: 2,
    maxTime: "1h",
    price: 30000,
    priority: "standard",
    status: "accepted",
  },
  {
    id: "5",
    pickupAddress: "Boutique Mode",
    pickupArea: "Taouyah",
    deliveryAddress: "Cité Chemin de Fer",
    deliveryArea: "Almamya",
    distance: "3.5 km",
    packages: 1,
    maxTime: "45 min",
    price: 18000,
    priority: "low",
    status: "accepted",
  },
  {
    id: "6",
    pickupAddress: "Entrepôt Logistique",
    pickupArea: "Zone Industrielle",
    deliveryAddress: "Quartier Cameroun",
    deliveryArea: "Matoto",
    distance: "12 km",
    packages: 5,
    maxTime: "2h",
    price: 65000,
    priority: "urgent",
    status: "delivered",
  },
];

const CourierMissions = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");

  const filterMissions = (status: string) => {
    return allMissions.filter((m) => {
      const matchesStatus = status === "all" || m.status === status || 
        (status === "available" && m.status === "available") ||
        (status === "accepted" && (m.status === "accepted" || m.status === "pickup" || m.status === "in_transit")) ||
        (status === "delivered" && m.status === "delivered");
      
      const matchesSearch = m.pickupArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.deliveryArea.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesZone = zoneFilter === "all" || 
        m.pickupArea.toLowerCase() === zoneFilter.toLowerCase() ||
        m.deliveryArea.toLowerCase() === zoneFilter.toLowerCase();
      
      return matchesStatus && matchesSearch && matchesZone;
    });
  };

  const handleAccept = (missionId: string) => {
    console.log("Accepting mission:", missionId);
    // TODO: API call to accept mission
  };

  const handleViewDetails = (missionId: string) => {
    navigate(`/courier/mission/${missionId}`);
  };

  return (
    <CourierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold">Missions</h1>
          <p className="text-muted-foreground">Gérez vos livraisons</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par zone..."
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
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Plus de filtres
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="available" className="gap-2">
              Disponibles
              <span className="bg-guinea-green/20 text-guinea-green text-xs px-2 py-0.5 rounded-full">
                {filterMissions("available").length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="accepted" className="gap-2">
              Acceptées
              <span className="bg-guinea-yellow/20 text-guinea-yellow text-xs px-2 py-0.5 rounded-full">
                {filterMissions("accepted").length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="delivered" className="gap-2">
              Terminées
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterMissions("available").map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onAccept={() => handleAccept(mission.id)}
                  onViewDetails={() => handleViewDetails(mission.id)}
                />
              ))}
            </div>
            {filterMissions("available").length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucune mission disponible pour le moment</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="accepted" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterMissions("accepted").map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onViewDetails={() => handleViewDetails(mission.id)}
                  showActions={true}
                />
              ))}
            </div>
            {filterMissions("accepted").length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucune mission acceptée</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="delivered" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterMissions("delivered").map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onViewDetails={() => handleViewDetails(mission.id)}
                  showActions={false}
                />
              ))}
            </div>
            {filterMissions("delivered").length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucune mission terminée</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </CourierLayout>
  );
};

export default CourierMissions;
