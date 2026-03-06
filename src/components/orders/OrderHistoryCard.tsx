import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle, ChefHat, ShoppingBag, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { Timestamp } from "firebase/firestore";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "shipped"
  | "in_delivery"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  name: string;
  image?: string;
  quantity: number;
  price: number;
  productId?: string;
}

export interface OrderData {
  id: string;
  orderNumber?: string;
  status: OrderStatus;
  createdAt: Timestamp | string | null;
  totalAmount: number;
  items: OrderItem[];
  shippingAddress?: any;
  paymentMethod?: string;
}

interface OrderHistoryCardProps {
  order: OrderData;
  index: number;
}

const statusConfigMap: Record<
  OrderStatus,
  { labelKey: string; fallback: string; color: string; icon: React.ElementType }
> = {
  pending: { labelKey: "statusPending", fallback: "En attente", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  confirmed: { labelKey: "statusConfirmed", fallback: "Confirmée", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle },
  preparing: { labelKey: "statusPreparing", fallback: "En préparation", color: "bg-primary/10 text-primary border-primary/20", icon: ChefHat },
  ready: { labelKey: "statusReady", fallback: "Prête", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: ShoppingBag },
  shipped: { labelKey: "statusShipped", fallback: "Expédiée", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20", icon: Package },
  in_delivery: { labelKey: "statusTransit", fallback: "En livraison", color: "bg-violet-500/10 text-violet-600 border-violet-500/20", icon: Truck },
  delivered: { labelKey: "statusDelivered", fallback: "Livrée", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle },
  cancelled: { labelKey: "statusCancelled", fallback: "Annulée", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

export function OrderHistoryCard({ order, index }: OrderHistoryCardProps) {
  const { t, language } = useTranslation();

  const cfg = statusConfigMap[order.status] || statusConfigMap.pending;
  const StatusIcon = cfg.icon;
  const statusLabel = (t.orders as any)?.[cfg.labelKey] || cfg.fallback;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-GN").format(price) + " GNF";

  const formatDate = (ts: Timestamp | string | null) => {
    if (!ts) return "";
    const date = typeof ts === "string" ? new Date(ts) : (ts as any).toDate ? (ts as any).toDate() : new Date(ts as any);
    const locale = language === "ar" ? "ar-SA" : language === "en" ? "en-US" : "fr-FR";
    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const displayId = order.orderNumber || order.id;
  const itemCount = order.items?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/order/${displayId}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-semibold text-foreground">
                    {displayId}
                  </span>
                  <Badge variant="outline" className={cn("text-xs", cfg.color)}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusLabel}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(order.createdAt)} • {itemCount}{" "}
                  {itemCount > 1
                    ? t.orders?.articles || "articles"
                    : t.orders?.article || "article"}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* Order Items Preview */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex -space-x-2">
                {order.items?.slice(0, 3).map((item, i) => (
                  item.image ? (
                    <img
                      key={i}
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg border-2 border-background object-cover"
                    />
                  ) : (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-lg border-2 border-background bg-secondary flex items-center justify-center"
                    >
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )
                ))}
                {itemCount > 3 && (
                  <div className="w-12 h-12 rounded-lg border-2 border-background bg-secondary flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      +{itemCount - 3}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {order.items?.[0]?.name || "Article"}
                  {itemCount > 1 &&
                    ` ${t.orders?.andOther || "et"} ${itemCount - 1} ${
                      itemCount > 2
                        ? t.orders?.others || "autres"
                        : t.orders?.other || "autre"
                    }`}
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                {t.orders?.total || "Total"}
              </span>
              <span className="font-semibold text-primary">
                {formatPrice(order.totalAmount || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
