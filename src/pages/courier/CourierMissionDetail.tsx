import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CourierLayout } from "@/components/courier/CourierLayout";
import { SwipeStatusButton } from "@/components/courier/SwipeStatusButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  Package,
  Clock,
  Store,
  CheckCircle2,
  Circle,
  Loader2,
  Navigation2,
  Crosshair,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { useCourierMissions, DeliveryMission, DeliveryStatus } from "@/hooks/useCourierMissions";
import { useCourierGPS } from "@/hooks/useCourierGPS";

type StepStatus = "accepted" | "pickup_started" | "picked_up" | "in_transit" | "arrived" | "delivered";

const statusSteps: { status: StepStatus; label: string }[] = [
  { status: "accepted", label: "Acceptée" },
  { status: "pickup_started", label: "En route vers pickup" },
  { status: "picked_up", label: "Colis récupéré" },
  { status: "in_transit", label: "En livraison" },
  { status: "arrived", label: "Arrivé chez le client" },
  { status: "delivered", label: "Livrée" },
];

const CourierMissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { acceptMission, updateMissionStatus } = useCourierMissions();
  const [mission, setMission] = useState<DeliveryMission | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Extract GPS coordinates from mission if available
  const pickupCoords = mission?.pickup && 'lat' in mission.pickup
    ? { lat: (mission.pickup as any).lat, lng: (mission.pickup as any).lng }
    : null;
  const deliveryCoords = mission?.delivery && 'lat' in mission.delivery
    ? { lat: (mission.delivery as any).lat, lng: (mission.delivery as any).lng }
    : null;

  // GPS tracking
  const gps = useCourierGPS({
    missionId: id,
    pickupCoords,
    deliveryCoords,
    currentStatus: mission?.status,
  });

  // Real-time listener on this delivery document
  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "deliveries", id), (snap) => {
      if (snap.exists()) {
        setMission({ ...snap.data(), id: snap.id } as DeliveryMission);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  if (loading) {
    return (
      <CourierLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </CourierLayout>
    );
  }

  if (!mission) {
    return (
      <CourierLayout>
        <div className="text-center py-20 text-muted-foreground">
          <p>Mission introuvable</p>
          <Button className="mt-4" onClick={() => navigate("/courier/missions")}>
            Retour aux missions
          </Button>
        </div>
      </CourierLayout>
    );
  }

  const currentStepIndex = statusSteps.findIndex((s) => s.status === mission.status);
  const isPending = mission.status === "pending";

  const handleAccept = async () => {
    setUpdating(true);
    await acceptMission(mission.id);
    setUpdating(false);
  };

  const handleNextStatus = async () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < statusSteps.length) {
      setUpdating(true);
      await updateMissionStatus(mission.id, statusSteps[nextIndex].status as DeliveryStatus);
      setUpdating(false);
    }
  };

  const getNextStatusLabel = () => {
    if (isPending) return "Accepter la mission";
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < statusSteps.length) {
      return `Marquer : ${statusSteps[nextIndex].label}`;
    }
    return "Mission terminée";
  };

  const formatPrice = (p: number) => p.toLocaleString("fr-GN") + " GNF";

  return (
    <CourierLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold">
              Mission {mission.orderId.slice(0, 16)}
            </h1>
            <p className="text-sm text-muted-foreground">
              ~{mission.estimatedTime} min
            </p>
          </div>
          {mission.priority === "express" && (
            <Badge className="bg-destructive/10 text-destructive border-destructive/20">
              EXPRESS
            </Badge>
          )}
        </div>

        {/* Status Timeline */}
        {!isPending && (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {statusSteps.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const isPendingStep = index > currentStepIndex;

                  return (
                    <div key={step.status} className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            isCompleted && "bg-guinea-green text-white",
                            isCurrent && "bg-accent text-white",
                            isPendingStep && "bg-muted text-muted-foreground"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </div>
                        {index < statusSteps.length - 1 && (
                          <div
                            className={cn(
                              "w-0.5 h-8",
                              isCompleted ? "bg-guinea-green" : "bg-muted"
                            )}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={cn(
                            "font-medium",
                            isCurrent && "text-accent",
                            isCompleted && "text-guinea-green",
                            isPendingStep && "text-muted-foreground"
                          )}
                        >
                          {step.label}
                          {isCurrent && (
                            <span className="ml-2 text-xs bg-accent/20 px-2 py-0.5 rounded-full">
                              En cours
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pickup Info */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="bg-guinea-green/10 px-4 py-2 border-b border-border">
            <div className="flex items-center gap-2 text-guinea-green font-medium">
              <Store className="w-4 h-4" />
              Point de récupération
            </div>
          </div>
          <CardContent className="pt-4 space-y-3">
            <div>
              <p className="font-medium">{mission.pickup.commune}</p>
              <p className="text-sm text-muted-foreground">{mission.pickup.address}</p>
              {mission.pickup.instructions && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {mission.pickup.instructions}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(mission.pickup as any).phone && (
                <>
                  <a href={`tel:${(mission.pickup as any).phone}`} className="flex-1 min-w-[120px]">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Phone className="w-4 h-4" />
                      Appeler vendeur
                    </Button>
                  </a>
                  <a
                    href={`https://wa.me/${(mission.pickup as any).phone.replace(/[^0-9+]/g, '').replace(/^\+/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[120px]"
                  >
                    <Button variant="outline" size="sm" className="w-full gap-2 text-guinea-green border-guinea-green/30 hover:bg-guinea-green/10">
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp vendeur
                    </Button>
                  </a>
                </>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${mission.pickup.address}, ${mission.pickup.commune}, Conakry, Guinée`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[120px]"
              >
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Navigation className="w-4 h-4" />
                  Naviguer
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Info */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="bg-destructive/10 px-4 py-2 border-b border-border">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <MapPin className="w-4 h-4" />
              Point de livraison
            </div>
          </div>
          <CardContent className="pt-4 space-y-3">
            <div>
              {mission.delivery.fullName && (
                <p className="font-medium">{mission.delivery.fullName}</p>
              )}
              <p className="text-sm font-medium">{mission.delivery.commune}</p>
              <p className="text-sm text-muted-foreground">{mission.delivery.address}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {mission.delivery.phone && (
                <>
                  <a href={`tel:${mission.delivery.phone}`} className="flex-1 min-w-[120px]">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Phone className="w-4 h-4" />
                      Appeler
                    </Button>
                  </a>
                  <a
                    href={`https://wa.me/${mission.delivery.phone.replace(/[^0-9+]/g, '').replace(/^\+/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[120px]"
                  >
                    <Button variant="outline" size="sm" className="w-full gap-2 text-guinea-green border-guinea-green/30 hover:bg-guinea-green/10">
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>
                  </a>
                </>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${mission.delivery.address}, ${mission.delivery.commune}, Conakry, Guinée`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[120px]"
              >
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Navigation className="w-4 h-4" />
                  Naviguer
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Earnings */}
        <Card className="bg-guinea-green/5 border-guinea-green/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Temps estimé: {mission.estimatedTime} min
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-display font-bold text-guinea-green">
                  {formatPrice(mission.fee)}
                </p>
                <p className="text-xs text-muted-foreground">Gain pour cette mission</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GPS Status */}
        {!isPending && mission.status !== "delivered" && (
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  gps.position ? "bg-guinea-green/10" : "bg-destructive/10"
                )}>
                  <Crosshair className={cn(
                    "w-5 h-5",
                    gps.position ? "text-guinea-green" : "text-destructive"
                  )} />
                </div>
                <div className="flex-1">
                  {gps.error ? (
                    <p className="text-sm text-destructive">{gps.error}</p>
                  ) : gps.position ? (
                    <>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Navigation2 className="w-3 h-3 text-guinea-green" />
                        GPS actif
                        {gps.position.accuracy && (
                          <span className="text-xs text-muted-foreground">
                            (±{Math.round(gps.position.accuracy)}m)
                          </span>
                        )}
                      </p>
                      {gps.distanceToTarget !== null && (
                        <p className="text-xs text-muted-foreground">
                          {gps.formatDistance(gps.distanceToTarget)} du {gps.targetLabel}
                          {gps.isNearTarget && (
                            <span className="ml-2 text-guinea-green font-semibold">
                              ✓ À proximité
                            </span>
                          )}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Localisation en cours...</p>
                  )}
                </div>
                {gps.position?.speed !== null && gps.position?.speed !== undefined && gps.position.speed > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {Math.round(gps.position.speed * 3.6)} km/h
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {isPending && (
          <Button
            className="w-full bg-guinea-green hover:bg-guinea-green/90 h-14 text-lg font-bold"
            disabled={updating}
            onClick={handleAccept}
          >
            {updating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Accepter la mission
          </Button>
        )}

        {!isPending && mission.status !== "delivered" && (
          <div className="sticky bottom-4">
            <SwipeStatusButton
              onComplete={handleNextStatus}
              label={getNextStatusLabel()}
              completedLabel="Statut mis à jour !"
              gpsInfo={{
                distanceToTarget: gps.distanceToTarget,
                isNearTarget: gps.isNearTarget,
                targetLabel: gps.targetLabel,
                formatDistance: gps.formatDistance,
                error: gps.error,
              }}
            />
          </div>
        )}

        {mission.status === "delivered" && (
          <div className="bg-guinea-green/10 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-guinea-green mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg text-guinea-green">
              Mission terminée !
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              +{formatPrice(mission.fee)} ajoutés à votre wallet
            </p>
            <Button className="mt-4" onClick={() => navigate("/courier/missions")}>
              Voir d'autres missions
            </Button>
          </div>
        )}
      </div>
    </CourierLayout>
  );
};

export default CourierMissionDetail;
