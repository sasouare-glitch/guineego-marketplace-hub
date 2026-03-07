import { CourierLayout } from "@/components/courier/CourierLayout";
import { CourierStats } from "@/components/courier/CourierStats";
import { EarningsChart } from "@/components/courier/EarningsChart";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCourierMissions, DeliveryMission } from "@/hooks/useCourierMissions";
import { useWallet } from "@/hooks/useWallet";
import { Loader2, TrendingUp, MapPin, Clock, Star, Package } from "lucide-react";

function getDeliveryStats(missions: DeliveryMission[]) {
  const delivered = missions.filter((m) => m.status === "delivered");
  const communes: Record<string, number> = {};
  delivered.forEach((m) => {
    const c = m.delivery?.commune || "Inconnu";
    communes[c] = (communes[c] || 0) + 1;
  });
  const topZones = Object.entries(communes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalFees = delivered.reduce((s, m) => s + (m.fee || 0), 0);
  const avgFee = delivered.length > 0 ? Math.round(totalFees / delivered.length) : 0;

  return { delivered: delivered.length, topZones, totalFees, avgFee };
}

export default function CourierStatsPage() {
  const { myMissions, loading } = useCourierMissions();
  const { wallet } = useWallet();

  if (loading) {
    return (
      <CourierLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </CourierLayout>
    );
  }

  const stats = getDeliveryStats(myMissions);

  return (
    <CourierLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Statistiques</h1>
          <p className="text-muted-foreground">Aperçu de vos performances</p>
        </div>

        <CourierStats myMissions={myMissions} wallet={wallet} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EarningsChart missions={myMissions} />

          {/* Top zones */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Zones les plus fréquentes
            </h3>
            {stats.topZones.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune livraison encore</p>
            ) : (
              <div className="space-y-3">
                {stats.topZones.map(([zone, count], i) => (
                  <div key={zone} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="font-medium">{zone}</span>
                    </div>
                    <Badge variant="secondary">{count} livraisons</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <Package className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.delivered}</p>
            <p className="text-xs text-muted-foreground">Livraisons totales</p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-guinea-green mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalFees.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Gains totaux (GNF)</p>
          </Card>
          <Card className="p-4 text-center">
            <Star className="w-6 h-6 text-guinea-yellow mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.avgFee.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Gain moyen (GNF)</p>
          </Card>
          <Card className="p-4 text-center">
            <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold">{myMissions.filter((m) => m.status !== "delivered" && m.status !== "cancelled").length}</p>
            <p className="text-xs text-muted-foreground">En cours</p>
          </Card>
        </div>
      </div>
    </CourierLayout>
  );
}
