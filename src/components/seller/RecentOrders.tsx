import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Package, Clock, CheckCircle2, Truck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  customer: string;
  amount: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  items: number;
  date: string;
}

const orders: Order[] = [
  {
    id: "#GG-1234",
    customer: "Mamadou Barry",
    amount: "450.000 GNF",
    status: "pending",
    items: 3,
    date: "Il y a 5 min",
  },
  {
    id: "#GG-1233",
    customer: "Fatoumata Camara",
    amount: "125.000 GNF",
    status: "processing",
    items: 1,
    date: "Il y a 30 min",
  },
  {
    id: "#GG-1232",
    customer: "Ibrahima Sow",
    amount: "780.000 GNF",
    status: "shipped",
    items: 5,
    date: "Il y a 2h",
  },
  {
    id: "#GG-1231",
    customer: "Aissatou Diallo",
    amount: "95.000 GNF",
    status: "delivered",
    items: 2,
    date: "Hier",
  },
  {
    id: "#GG-1230",
    customer: "Oumar Bah",
    amount: "320.000 GNF",
    status: "cancelled",
    items: 4,
    date: "Hier",
  },
];

const statusConfig = {
  pending: {
    label: "En attente",
    icon: Clock,
    variant: "bg-accent/10 text-accent border-accent/20",
  },
  processing: {
    label: "En préparation",
    icon: Package,
    variant: "bg-primary/10 text-primary border-primary/20",
  },
  shipped: {
    label: "Expédiée",
    icon: Truck,
    variant: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  delivered: {
    label: "Livrée",
    icon: CheckCircle2,
    variant: "bg-primary/10 text-primary border-primary/20",
  },
  cancelled: {
    label: "Annulée",
    icon: XCircle,
    variant: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function RecentOrders() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card rounded-xl border border-border shadow-sm"
    >
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Commandes récentes
          </h3>
          <p className="text-sm text-muted-foreground">
            Dernières commandes reçues
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/seller/orders" className="flex items-center gap-1">
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      <div className="divide-y divide-border">
        {orders.map((order) => {
          const status = statusConfig[order.status];
          const StatusIcon = status.icon;

          return (
            <Link
              key={order.id}
              to={`/seller/orders/${order.id}`}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {order.id}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      • {order.items} articles
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.customer}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">
                    {order.amount}
                  </p>
                  <p className="text-xs text-muted-foreground">{order.date}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("flex items-center gap-1", status.variant)}
                >
                  <StatusIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">{status.label}</span>
                </Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
