import { CourierLayout } from "@/components/courier/CourierLayout";
import { CourierStats } from "@/components/courier/CourierStats";
import { EarningsChart } from "@/components/courier/EarningsChart";
import { MissionCard, Mission } from "@/components/courier/MissionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const activeMissions: Mission[] = [
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
    status: "in_transit",
    customerName: "Fatoumata D.",
    shopName: "TechShop GN",
  },
];

const availableMissions: Mission[] = [
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
];

const CourierDashboard = () => {
  return (
    <CourierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold">Bonjour, Mamadou 👋</h1>
          <p className="text-muted-foreground">Voici votre activité du jour</p>
        </div>

        {/* Stats */}
        <CourierStats />

        {/* Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Mission */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-guinea-green" />
                  Mission en cours
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {activeMissions.length > 0 ? (
                <Link to={`/courier/mission/${activeMissions[0].id}`}>
                  <MissionCard 
                    mission={activeMissions[0]} 
                    showActions={false}
                  />
                </Link>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucune mission en cours</p>
                  <Button className="mt-4" asChild>
                    <Link to="/courier/missions">Voir les missions disponibles</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Earnings Chart */}
          <EarningsChart />
        </div>

        {/* Available Missions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-lg">Missions disponibles</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/courier/missions" className="text-primary">
                  Voir tout
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {availableMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onAccept={() => console.log("Accept", mission.id)}
                  onViewDetails={() => console.log("View", mission.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </CourierLayout>
  );
};

export default CourierDashboard;
