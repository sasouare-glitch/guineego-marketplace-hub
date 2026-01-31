import { useState } from "react";
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
  User,
  CheckCircle2,
  Circle
} from "lucide-react";
import { cn } from "@/lib/utils";

type MissionStatus = "accepted" | "pickup" | "in_transit" | "delivered";

const statusSteps: { status: MissionStatus; label: string }[] = [
  { status: "accepted", label: "Acceptée" },
  { status: "pickup", label: "Récupération" },
  { status: "in_transit", label: "En livraison" },
  { status: "delivered", label: "Livrée" },
];

const CourierMissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState<MissionStatus>("pickup");

  // Mock data - would come from API
  const mission = {
    id: id || "1",
    pickupAddress: "Av. République, Imm. 45, 2ème étage",
    pickupArea: "Kaloum",
    deliveryAddress: "Quartier Cosa, Villa 12, Porte verte",
    deliveryArea: "Ratoma",
    distance: "4.2 km",
    packages: 2,
    maxTime: "45 min",
    price: 25000,
    priority: "urgent" as const,
    shopName: "TechShop Conakry",
    shopPhone: "+224 628 12 34 56",
    customerName: "Fatoumata Diallo",
    customerPhone: "+224 622 98 76 54",
    orderRef: "#GG-2024-0892",
    items: ["iPhone 13 Pro", "Coque de protection"],
  };

  const currentStepIndex = statusSteps.findIndex(s => s.status === currentStatus);

  const handleStatusChange = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < statusSteps.length) {
      setCurrentStatus(statusSteps[nextIndex].status);
    }
  };

  const getNextStatusLabel = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < statusSteps.length) {
      return `Marquer comme ${statusSteps[nextIndex].label.toLowerCase()}`;
    }
    return "Mission terminée";
  };

  return (
    <CourierLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold">Mission {mission.orderRef}</h1>
            <p className="text-sm text-muted-foreground">
              {mission.distance} • {mission.packages} colis
            </p>
          </div>
          <Badge className="bg-guinea-red/10 text-guinea-red border-guinea-red/20">
            URGENT
          </Badge>
        </div>

        {/* Status Timeline */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {statusSteps.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isPending = index > currentStepIndex;

                return (
                  <div key={step.status} className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          isCompleted && "bg-guinea-green text-white",
                          isCurrent && "bg-guinea-yellow text-white",
                          isPending && "bg-muted text-muted-foreground"
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
                          isCurrent && "text-guinea-yellow",
                          isCompleted && "text-guinea-green",
                          isPending && "text-muted-foreground"
                        )}
                      >
                        {step.label}
                        {isCurrent && (
                          <span className="ml-2 text-xs bg-guinea-yellow/20 px-2 py-0.5 rounded-full">
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
              <p className="font-medium">{mission.shopName}</p>
              <p className="text-sm text-muted-foreground">{mission.pickupArea}</p>
              <p className="text-sm text-muted-foreground">{mission.pickupAddress}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Phone className="w-4 h-4" />
                Appeler
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Navigation className="w-4 h-4" />
                Naviguer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Info */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="bg-guinea-red/10 px-4 py-2 border-b border-border">
            <div className="flex items-center gap-2 text-guinea-red font-medium">
              <MapPin className="w-4 h-4" />
              Point de livraison
            </div>
          </div>
          <CardContent className="pt-4 space-y-3">
            <div>
              <p className="font-medium">{mission.customerName}</p>
              <p className="text-sm text-muted-foreground">{mission.deliveryArea}</p>
              <p className="text-sm text-muted-foreground">{mission.deliveryAddress}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Phone className="w-4 h-4" />
                Appeler
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <MessageCircle className="w-4 h-4" />
                Message
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Navigation className="w-4 h-4" />
                Naviguer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Package Details */}
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Contenu de la commande</span>
            </div>
            <ul className="space-y-2">
              {mission.items.map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Earnings */}
        <Card className="bg-guinea-green/5 border-guinea-green/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Temps max: {mission.maxTime}</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-display font-bold text-guinea-green">
                  {mission.price.toLocaleString('fr-GN')} GNF
                </p>
                <p className="text-xs text-muted-foreground">Gain pour cette mission</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Swipe Action */}
        {currentStatus !== "delivered" && (
          <div className="sticky bottom-4">
            <SwipeStatusButton
              onComplete={handleStatusChange}
              label={getNextStatusLabel()}
              completedLabel="Statut mis à jour !"
            />
          </div>
        )}

        {currentStatus === "delivered" && (
          <div className="bg-guinea-green/10 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-guinea-green mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg text-guinea-green">Mission terminée !</h3>
            <p className="text-sm text-muted-foreground mt-1">
              +{mission.price.toLocaleString('fr-GN')} GNF ajoutés à votre wallet
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
