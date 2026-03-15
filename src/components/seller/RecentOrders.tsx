import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Package, Clock, CheckCircle2, Truck, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import type { DashboardOrder } from "@/hooks/useSellerDashboard";

const statusConfig: Record<string, { label: string; icon: any; variant: string }> = {
  pending: { label: "En attente", icon: Clock, variant: "bg-accent/10 text-accent border-accent/20" },
  confirmed: { label: "Confirmée", icon: CheckCircle2, variant: "bg-primary/10 text-primary border-primary/20" },
  preparing: { label: "En préparation", icon: Package, variant: "bg-primary/10 text-primary border-primary/20" },
  ready: { label: "Prête", icon: Package, variant: "bg-primary/10 text-primary border-primary/20" },
  shipped: { label: "Expédiée", icon: Truck, variant: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  delivered: { label: "Livrée", icon: CheckCircle2, variant: "bg-primary/10 text-primary border-primary/20" },
  cancelled: { label: "Annulée", icon: XCircle, variant: "bg-destructive/10 text-destructive border-destructive/20" },
};

function timeAgo(ts: any): string {
  if (!ts) return '';
  const now = Date.now();
  const then = ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return `Il y a ${Math.floor(diff / 86400)}j`;
}

interface RecentOrdersProps {
  orders: DashboardOrder[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const { format: formatPrice } = useCurrency();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card rounded-xl border border-border shadow-sm"
    >
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Commandes récentes</h3>
          <p className="text-sm text-muted-foreground">Dernières commandes reçues</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/seller/orders" className="flex items-center gap-1">
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p className="text-sm">Aucune commande pour le moment</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <Link
                key={order.id}
                to={`/seller/orders`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        #{order.id.slice(0, 8)}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        • {order.items} article{order.items > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.customer}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-foreground">
                      {formatPrice(order.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(order.createdAt)}</p>
                  </div>
                  <Badge variant="outline" className={cn("flex items-center gap-1", status.variant)}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">{status.label}</span>
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
