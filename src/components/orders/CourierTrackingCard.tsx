import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Truck, Phone, MapPin, Clock, Navigation, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeliveryTracking } from "@/hooks/useDeliveryTracking";
import { Skeleton } from "@/components/ui/skeleton";
import { DeliveryMap } from "@/components/delivery/DeliveryMap";

interface CourierTrackingCardProps {
  deliveryMissionId: string;
}

const statusLabels: Record<string, string> = {
  pending: "En attente d'un coursier",
  accepted: "Coursier assigné",
  pickup_started: "En route vers le vendeur",
  picked_up: "Colis récupéré",
  in_transit: "En livraison",
  arrived: "Arrivé à destination",
  delivered: "Livré",
  cancelled: "Annulé",
};

const statusColors: Record<string, string> = {
  pending: "secondary",
  accepted: "outline",
  pickup_started: "outline",
  picked_up: "default",
  in_transit: "default",
  arrived: "default",
  delivered: "default",
  cancelled: "destructive",
};

export function CourierTrackingCard({ deliveryMissionId }: CourierTrackingCardProps) {
  const {
    delivery,
    loading,
    currentStatus,
    progress,
    statusMessage,
    courierLocation,
    lastLocationUpdate,
    timeRemaining,
  } = useDeliveryTracking(deliveryMissionId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Suivi livraison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!delivery) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Suivi livraison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Mission introuvable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Suivi livraison
          </CardTitle>
          <Badge variant={statusColors[currentStatus || "pending"] as any}>
            {statusLabels[currentStatus || "pending"]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Collecte</span>
            <span>Livraison</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">{statusMessage}</p>
        </div>

        {/* Courier Info */}
        {delivery.courierName && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">{delivery.courierName}</p>
              {delivery.courierPhone && (
                <p className="text-xs text-muted-foreground">{delivery.courierPhone}</p>
              )}
            </div>
            {delivery.courierPhone && (
              <a href={`tel:${delivery.courierPhone}`}>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                  <Phone className="w-4 h-4" />
                </Button>
              </a>
            )}
          </div>
        )}

        {/* ETA */}
        {timeRemaining !== null && timeRemaining > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Arrivée estimée dans</span>
            <span className="font-semibold text-foreground">{timeRemaining} min</span>
          </div>
        )}

        {/* Courier Map */}
        {courierLocation && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Navigation className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Position en direct</span>
            </div>
            <DeliveryMap
              courierPosition={{ lat: courierLocation.lat, lng: courierLocation.lng }}
              courierName={delivery.courierName || 'Coursier'}
              pickupAddress={delivery.pickup?.address}
              pickupCommune={delivery.pickup?.commune}
              pickupLabel={delivery.pickup?.address || 'Point de collecte'}
              deliveryAddress={delivery.delivery?.address}
              deliveryCommune={delivery.delivery?.commune}
              deliveryLabel={delivery.delivery?.address || 'Destination'}
              className="h-[220px]"
            />
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {courierLocation.speed && courierLocation.speed > 0 && (
                <span>🏎️ {Math.round(courierLocation.speed * 3.6)} km/h</span>
              )}
              {lastLocationUpdate && (
                <span>🕐 {lastLocationUpdate.toLocaleTimeString("fr-FR")}</span>
              )}
            </div>
          </div>
        )}

        {/* Delivery addresses */}
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Point de collecte</p>
              <p className="text-sm text-foreground">{delivery.pickup?.address || "—"}</p>
              <p className="text-xs text-muted-foreground">{delivery.pickup?.commune}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Destination</p>
              <p className="text-sm text-foreground">{delivery.delivery?.address || "—"}</p>
              <p className="text-xs text-muted-foreground">{delivery.delivery?.commune}</p>
            </div>
          </div>
        </div>

        {/* Mission ID */}
        <p className="text-xs text-muted-foreground font-mono pt-1">
          Mission: {deliveryMissionId}
        </p>
      </CardContent>
    </Card>
  );
}
