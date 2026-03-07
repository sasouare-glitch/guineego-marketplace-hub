import { CourierMobileLayout } from "@/components/courier/mobile/CourierMobileLayout";
import { QuickStatsBar } from "@/components/courier/mobile/QuickStatsBar";
import { MissionCardSimple, SimpleMission } from "@/components/courier/mobile/MissionCardSimple";
import { BigActionButton } from "@/components/courier/mobile/BigActionButton";
import { QrCode, Package, Loader2, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCourierMissions, DeliveryMission } from "@/hooks/useCourierMissions";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";

// Convert Firestore DeliveryMission → SimpleMission for the card component
function toSimpleMission(m: DeliveryMission, isAvailable: boolean): SimpleMission {
  return {
    id: m.id,
    pickupArea: m.pickup.commune,
    deliveryArea: m.delivery.commune,
    packages: 1,
    price: m.fee,
    priority: m.priority === "express" ? "express" : "standard",
    status: isAvailable ? "available" : (m.status as SimpleMission["status"]),
    customerPhone: m.delivery.phone,
  };
}

const CourierMobileHome = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { available, myMissions, loading, acceptMission, updateMissionStatus } = useCourierMissions();
  const { wallet } = useWallet();
  const { supported: pushSupported, permission: pushPermission, requestPermission } = usePushNotifications();

  const activeMission = myMissions.find(
    (m) => m.status !== "delivered" && m.status !== "cancelled"
  );

  // Today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDelivered = myMissions.filter((m) => {
    if (m.status !== "delivered") return false;
    const d = m.deliveredAt?.toDate?.() ? m.deliveredAt.toDate() : m.deliveredAt;
    return d && new Date(d as any) >= today;
  });
  const todayEarnings = todayDelivered.reduce((sum, m) => sum + (m.fee || 0), 0);

  const displayName = user?.displayName?.split(" ")[0] || "Coursier";

  if (loading) {
    return (
      <CourierMobileLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </CourierMobileLayout>
    );
  }

  return (
    <CourierMobileLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black">Bonjour {displayName} 👋</h1>
          <p className="text-lg text-muted-foreground font-medium mt-1">
            Bonne journée de livraison !
          </p>
        </div>

        {pushSupported && pushPermission !== 'granted' && (
          <Button
            onClick={requestPermission}
            variant="outline"
            className="w-full flex items-center gap-2 border-primary text-primary"
          >
            <Bell className="w-4 h-4" />
            Activer les notifications pour les nouvelles missions
          </Button>
        )}

        <QuickStatsBar
          todayDeliveries={todayDelivered.length}
          todayEarnings={todayEarnings}
          rating={4.8}
        />

        <div className="grid grid-cols-2 gap-3">
          <Link to="/courier/scan">
            <BigActionButton icon={QrCode} label="SCANNER" color="primary" />
          </Link>
          <Link to="/courier/missions">
            <BigActionButton icon={Package} label="MISSIONS" color="yellow" />
          </Link>
        </div>

        {activeMission && (
          <div className="space-y-3">
            <h2 className="text-xl font-black flex items-center gap-2">
              <span className="w-3 h-3 bg-guinea-green rounded-full animate-pulse" />
              MISSION EN COURS
            </h2>
            <div onClick={() => navigate(`/courier/mission/${activeMission.id}`)} className="cursor-pointer">
              <MissionCardSimple
                mission={toSimpleMission(activeMission, false)}
                onCall={() => activeMission.delivery.phone && window.open(`tel:${activeMission.delivery.phone}`)}
                onNavigate={() => navigate(`/courier/mission/${activeMission.id}`)}
                onDeliver={() => updateMissionStatus(activeMission.id, "delivered")}
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-xl font-black">
            NOUVELLES MISSIONS {available.length > 0 && `(${available.length})`}
          </h2>
          {available.length > 0 ? (
            available.slice(0, 5).map((mission) => (
              <MissionCardSimple
                key={mission.id}
                mission={toSimpleMission(mission, true)}
                onAccept={hasRole('courier') ? () => acceptMission(mission.id) : undefined}
                onReject={() => {}}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-bold">Aucune mission disponible</p>
            </div>
          )}
        </div>
      </div>
    </CourierMobileLayout>
  );
};

export default CourierMobileHome;
