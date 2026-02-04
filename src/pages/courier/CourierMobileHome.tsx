import { CourierMobileLayout } from "@/components/courier/mobile/CourierMobileLayout";
import { QuickStatsBar } from "@/components/courier/mobile/QuickStatsBar";
import { MissionCardSimple, SimpleMission } from "@/components/courier/mobile/MissionCardSimple";
import { BigActionButton } from "@/components/courier/mobile/BigActionButton";
import { QrCode, Package } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data
const activeMission: SimpleMission | null = {
  id: "1",
  pickupArea: "Kaloum",
  deliveryArea: "Ratoma",
  packages: 2,
  price: 25000,
  priority: "urgent",
  status: "in_transit",
  customerPhone: "+224 622 00 00 00",
};

const availableMissions: SimpleMission[] = [
  {
    id: "2",
    pickupArea: "Matam",
    deliveryArea: "Dixinn",
    packages: 1,
    price: 15000,
    priority: "standard",
    status: "available",
  },
  {
    id: "3",
    pickupArea: "Kaloum",
    deliveryArea: "Lambanyi",
    packages: 3,
    price: 45000,
    priority: "express",
    status: "available",
  },
];

const CourierMobileHome = () => {
  return (
    <CourierMobileLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="text-center">
          <h1 className="text-3xl font-black">Bonjour Mamadou 👋</h1>
          <p className="text-lg text-muted-foreground font-medium mt-1">
            Bonne journée de livraison !
          </p>
        </div>

        {/* Quick Stats */}
        <QuickStatsBar
          todayDeliveries={5}
          todayEarnings={85000}
          rating={4.8}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/courier/scan">
            <BigActionButton
              icon={QrCode}
              label="SCANNER"
              color="primary"
            />
          </Link>
          <Link to="/courier/missions">
            <BigActionButton
              icon={Package}
              label="MISSIONS"
              color="yellow"
            />
          </Link>
        </div>

        {/* Active Mission */}
        {activeMission && (
          <div className="space-y-3">
            <h2 className="text-xl font-black flex items-center gap-2">
              <span className="w-3 h-3 bg-guinea-green rounded-full animate-pulse" />
              MISSION EN COURS
            </h2>
            <MissionCardSimple
              mission={activeMission}
              onCall={() => window.open(`tel:${activeMission.customerPhone}`)}
              onNavigate={() => console.log("Open GPS")}
              onDeliver={() => console.log("Mark as delivered")}
            />
          </div>
        )}

        {/* Available Missions */}
        <div className="space-y-3">
          <h2 className="text-xl font-black">NOUVELLES MISSIONS</h2>
          {availableMissions.map((mission) => (
            <MissionCardSimple
              key={mission.id}
              mission={mission}
              onAccept={() => console.log("Accept", mission.id)}
              onReject={() => console.log("Reject", mission.id)}
            />
          ))}
        </div>
      </div>
    </CourierMobileLayout>
  );
};

export default CourierMobileHome;
