import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface OrderData {
  id: string;
  orderNumber: string;
  status: "pending" | "preparing" | "transit" | "delivered" | "cancelled";
  createdAt: string;
  total: number;
  itemCount: number;
  items: {
    name: string;
    image: string;
    quantity: number;
  }[];
}

interface OrderHistoryCardProps {
  order: OrderData;
  index: number;
}

const statusConfig = {
  pending: {
    label: "En attente",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: Clock,
  },
  preparing: {
    label: "En préparation",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: Package,
  },
  transit: {
    label: "En livraison",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: Truck,
  },
  delivered: {
    label: "Livrée",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Annulée",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    icon: XCircle,
  },
};

export function OrderHistoryCard({ order, index }: OrderHistoryCardProps) {
  const config = statusConfig[order.status];
  const StatusIcon = config.icon;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-GN").format(price) + " GNF";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/order/${order.orderNumber}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-semibold text-foreground">
                    {order.orderNumber}
                  </span>
                  <Badge variant="outline" className={cn("text-xs", config.color)}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(order.createdAt)} • {order.itemCount} article{order.itemCount > 1 ? "s" : ""}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* Order Items Preview */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex -space-x-2">
                {order.items.slice(0, 3).map((item, i) => (
                  <img
                    key={i}
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg border-2 border-background object-cover"
                  />
                ))}
                {order.items.length > 3 && (
                  <div className="w-12 h-12 rounded-lg border-2 border-background bg-secondary flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      +{order.items.length - 3}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {order.items[0].name}
                  {order.items.length > 1 && ` et ${order.items.length - 1} autre${order.items.length > 2 ? "s" : ""}`}
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-semibold text-primary">{formatPrice(order.total)}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
