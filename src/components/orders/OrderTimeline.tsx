import { motion } from "framer-motion";
import { Check, Package, Truck, MapPin, Clock, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  time?: string;
  status: "completed" | "current" | "pending";
  icon: React.ReactNode;
}

interface OrderTimelineProps {
  steps: TimelineStep[];
}

export function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <div className="relative">
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative flex gap-4 pb-8 last:pb-0"
        >
          {/* Vertical Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "absolute left-5 top-10 w-0.5 h-full -translate-x-1/2",
                step.status === "completed" ? "bg-primary" : "bg-border"
              )}
            />
          )}

          {/* Icon */}
          <div
            className={cn(
              "relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
              step.status === "completed" && "bg-primary text-primary-foreground",
              step.status === "current" && "bg-primary text-primary-foreground animate-pulse",
              step.status === "pending" && "bg-secondary text-muted-foreground"
            )}
          >
            {step.status === "completed" ? (
              <Check className="w-5 h-5" />
            ) : (
              step.icon
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pt-1">
            <div className="flex items-center justify-between">
              <h4
                className={cn(
                  "font-semibold",
                  step.status === "pending" ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {step.title}
              </h4>
              {step.time && (
                <span className="text-sm text-muted-foreground">{step.time}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export const defaultOrderSteps: TimelineStep[] = [
  {
    id: "confirmed",
    title: "Commande confirmée",
    description: "Votre commande a été reçue et confirmée",
    time: "10:30",
    status: "completed",
    icon: <Check className="w-5 h-5" />,
  },
  {
    id: "preparing",
    title: "En préparation",
    description: "Le vendeur prépare votre commande",
    time: "10:45",
    status: "completed",
    icon: <ChefHat className="w-5 h-5" />,
  },
  {
    id: "picked",
    title: "Colis récupéré",
    description: "Le livreur a récupéré votre colis",
    time: "11:20",
    status: "current",
    icon: <Package className="w-5 h-5" />,
  },
  {
    id: "transit",
    title: "En cours de livraison",
    description: "Votre colis est en route vers vous",
    status: "pending",
    icon: <Truck className="w-5 h-5" />,
  },
  {
    id: "delivered",
    title: "Livré",
    description: "Votre commande a été livrée",
    status: "pending",
    icon: <MapPin className="w-5 h-5" />,
  },
];
