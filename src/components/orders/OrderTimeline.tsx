import { motion } from "framer-motion";
import { Check, Package, Truck, MapPin, Clock, ChefHat, CheckCircle, XCircle, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusHistoryEntry, OrderStatus } from "@/hooks/useRealtimeOrder";

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

// ============================================
// Build dynamic timeline from order data
// ============================================

const allSteps: { id: OrderStatus; title: string; description: string; icon: React.ReactNode }[] = [
  { id: "pending", title: "Commande reçue", description: "Votre commande a été enregistrée", icon: <Clock className="w-5 h-5" /> },
  { id: "confirmed", title: "Confirmée", description: "Le vendeur a confirmé votre commande", icon: <CheckCircle className="w-5 h-5" /> },
  { id: "preparing", title: "En préparation", description: "Le vendeur prépare votre commande", icon: <ChefHat className="w-5 h-5" /> },
  { id: "ready", title: "Prête", description: "Commande prête, en attente du coursier", icon: <ShoppingBag className="w-5 h-5" /> },
  { id: "shipped", title: "Colis récupéré", description: "Le livreur a récupéré votre colis", icon: <Package className="w-5 h-5" /> },
  { id: "in_delivery", title: "En livraison", description: "Votre colis est en route vers vous", icon: <Truck className="w-5 h-5" /> },
  { id: "delivered", title: "Livré", description: "Votre commande a été livrée avec succès", icon: <MapPin className="w-5 h-5" /> },
];

const statusOrder: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "shipped", "in_delivery", "delivered"];

function formatTimestamp(ts: any): string | undefined {
  if (!ts) return undefined;
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function buildTimelineSteps(
  currentStatus: OrderStatus,
  statusHistory: StatusHistoryEntry[] = [],
  createdAt?: any
): TimelineStep[] {
  if (currentStatus === "cancelled") {
    // Show steps up to cancellation
    const historyMap = new Map<string, StatusHistoryEntry>();
    statusHistory.forEach(entry => historyMap.set(entry.status, entry));

    const steps: TimelineStep[] = [];
    for (const step of allSteps) {
      const historyEntry = historyMap.get(step.id);
      if (historyEntry) {
        steps.push({
          ...step,
          time: formatTimestamp(historyEntry.timestamp),
          status: "completed",
        });
      } else if (step.id === "pending" && createdAt) {
        steps.push({
          ...step,
          time: formatTimestamp(createdAt),
          status: "completed",
        });
      }
    }
    // Add cancelled step
    const cancelEntry = statusHistory.find(e => e.status === "cancelled");
    steps.push({
      id: "cancelled",
      title: "Annulée",
      description: cancelEntry?.note || "Votre commande a été annulée",
      time: formatTimestamp(cancelEntry?.timestamp),
      status: "current",
      icon: <XCircle className="w-5 h-5" />,
    });
    return steps;
  }

  const currentIndex = statusOrder.indexOf(currentStatus);
  const historyMap = new Map<string, StatusHistoryEntry>();
  statusHistory.forEach(entry => historyMap.set(entry.status, entry));

  return allSteps.map((step) => {
    const stepIndex = statusOrder.indexOf(step.id);
    const historyEntry = historyMap.get(step.id);
    let time = historyEntry ? formatTimestamp(historyEntry.timestamp) : undefined;

    // For pending, use createdAt
    if (step.id === "pending" && !time && createdAt) {
      time = formatTimestamp(createdAt);
    }

    let status: "completed" | "current" | "pending";
    if (stepIndex < currentIndex) {
      status = "completed";
    } else if (stepIndex === currentIndex) {
      status = "current";
    } else {
      status = "pending";
    }

    return { ...step, time, status };
  });
}

// Keep legacy export for backwards compatibility
export const defaultOrderSteps: TimelineStep[] = allSteps.map((step, i) => ({
  ...step,
  status: i === 0 ? "current" : "pending",
}));
