import { WelcomeBanner } from "@/components/onboarding/WelcomeBanner";
import { CourierLayout } from "@/components/courier/CourierLayout";
import { CourierStats } from "@/components/courier/CourierStats";
import { EarningsChart } from "@/components/courier/EarningsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, MapPin, Package, Clock, Loader2, Truck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCourierMissions, DeliveryMission } from "@/hooks/useCourierMissions";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const formatPrice = (p: number) => p.toLocaleString("fr-GN") + " GNF";

function DashboardMissionCard({ mission }: { mission: DeliveryMission }) {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-start justify-between mb-3">
        <Badge variant="outline" className={cn("text-xs font-semibold",
          mission.priority === "express" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-muted text-muted-foreground"
        )}>
          {mission.priority === "express" ? "EXPRESS" : "Standard"}
        </Badge>
        <span className="font-display font-bold text-lg text-guinea-green">{formatPrice(mission.fee)}</span>
      </div>
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-guinea-green" />
          <span className="text-sm font-medium">{mission.pickup.commune}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3 h-3 text-destructive" />
          <span className="text-sm font-medium">{mission.delivery.commune}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{mission.estimatedTime} min</span>
        <span className="flex items-center gap-1"><Package className="w-3 h-3" />Réf: {mission.orderId.slice(0, 8)}</span>
      </div>
    </Card>
  );
}

const CourierDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { available, myMissions, loading, acceptMission } = useCourierMissions();
  const { wallet } = useWallet();

  const activeMissions = myMissions.filter(
    (m) => m.status !== "delivered" && m.status !== "cancelled"
  );

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Coursier";

  return (
    <CourierLayout>
      <div className="space-y-6">
        <WelcomeBanner
          role="courier"
          title="Bienvenue dans votre espace livreur"
          description="Activez votre statut en ligne pour recevoir vos premières missions de livraison et commencer à gagner."
          steps={[
            { label: "Voir les missions", href: "/courier/missions" },
            { label: "Mes revenus", href: "/courier/earnings" },
          ]}
        />

        <div>
          <h1 className="text-2xl font-display font-bold">Bonjour, {displayName} 👋</h1>
          <p className="text-muted-foreground">Voici votre activité du jour</p>
        </div>

        <CourierStats myMissions={myMissions} wallet={wallet} />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Active Mission */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-guinea-green" />
                  Mission en cours
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeMissions.length > 0 ? (
                  <Link to={`/courier/mission/${activeMissions[0].id}`}>
                    <DashboardMissionCard mission={activeMissions[0]} />
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

            <EarningsChart missions={myMissions} />
          </div>
        )}

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
            {available.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {available.slice(0, 4).map((mission) => (
                  <div key={mission.id} className="cursor-pointer" onClick={() => navigate(`/courier/mission/${mission.id}`)}>
                    <DashboardMissionCard mission={mission} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucune mission disponible pour le moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CourierLayout>
  );
};

export default CourierDashboard;
