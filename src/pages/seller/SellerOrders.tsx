import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  ChevronDown,
  Download,
} from "lucide-react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: string;
  date: string;
}

const orders: Order[] = [
  {
    id: "#GG-1234",
    customer: {
      name: "Mamadou Barry",
      phone: "+224 621 00 00 00",
      address: "Kaloum, Conakry",
    },
    items: [
      { name: "iPhone 15 Pro Max", qty: 1, price: 12500000 },
      { name: "Coque MagSafe", qty: 2, price: 450000 },
    ],
    total: 13400000,
    status: "pending",
    paymentMethod: "Orange Money",
    date: "2024-01-15 14:30",
  },
  {
    id: "#GG-1233",
    customer: {
      name: "Fatoumata Camara",
      phone: "+224 622 00 00 00",
      address: "Ratoma, Conakry",
    },
    items: [{ name: "AirPods Pro 2", qty: 1, price: 2500000 }],
    total: 2500000,
    status: "processing",
    paymentMethod: "MTN Money",
    date: "2024-01-15 12:15",
  },
  {
    id: "#GG-1232",
    customer: {
      name: "Ibrahima Sow",
      phone: "+224 623 00 00 00",
      address: "Dixinn, Conakry",
    },
    items: [
      { name: "MacBook Air M3", qty: 1, price: 15000000 },
      { name: "Chargeur USB-C", qty: 1, price: 350000 },
    ],
    total: 15350000,
    status: "shipped",
    paymentMethod: "Carte bancaire",
    date: "2024-01-14 16:45",
  },
  {
    id: "#GG-1231",
    customer: {
      name: "Aissatou Diallo",
      phone: "+224 624 00 00 00",
      address: "Matam, Conakry",
    },
    items: [{ name: "Samsung Galaxy S24", qty: 1, price: 9800000 }],
    total: 9800000,
    status: "delivered",
    paymentMethod: "Orange Money",
    date: "2024-01-13 09:20",
  },
  {
    id: "#GG-1230",
    customer: {
      name: "Oumar Bah",
      phone: "+224 625 00 00 00",
      address: "Matoto, Conakry",
    },
    items: [{ name: "iPad Pro 11\"", qty: 1, price: 11000000 }],
    total: 11000000,
    status: "cancelled",
    paymentMethod: "Orange Money",
    date: "2024-01-12 11:00",
  },
];

const statusConfig = {
  pending: {
    label: "En attente",
    icon: Clock,
    variant: "bg-accent/10 text-accent border-accent/20",
    action: "Préparer",
    nextStatus: "processing" as const,
  },
  processing: {
    label: "En préparation",
    icon: Package,
    variant: "bg-primary/10 text-primary border-primary/20",
    action: "Expédier",
    nextStatus: "shipped" as const,
  },
  shipped: {
    label: "Expédiée",
    icon: Truck,
    variant: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    action: "Marquer livrée",
    nextStatus: "delivered" as const,
  },
  delivered: {
    label: "Livrée",
    icon: CheckCircle2,
    variant: "bg-primary/10 text-primary border-primary/20",
    action: null,
    nextStatus: null,
  },
  cancelled: {
    label: "Annulée",
    icon: XCircle,
    variant: "bg-destructive/10 text-destructive border-destructive/20",
    action: null,
    nextStatus: null,
  },
};

const formatPrice = (price: number) => {
  return price.toLocaleString("fr-GN") + " GNF";
};

export default function SellerOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const processingCount = orders.filter((o) => o.status === "processing").length;

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold text-foreground">Commandes</h1>
            <p className="text-muted-foreground">
              {pendingCount > 0 && (
                <span className="text-accent font-medium">
                  {pendingCount} en attente •{" "}
                </span>
              )}
              {processingCount > 0 && (
                <span className="text-primary font-medium">
                  {processingCount} en préparation
                </span>
              )}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2"
          >
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exporter
            </Button>
          </motion.div>
        </div>

        {/* Status Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>
              Toutes ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="pending" onClick={() => setStatusFilter("pending")}>
              En attente ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="processing" onClick={() => setStatusFilter("processing")}>
              En préparation ({processingCount})
            </TabsTrigger>
            <TabsTrigger value="shipped" onClick={() => setStatusFilter("shipped")}>
              Expédiées
            </TabsTrigger>
            <TabsTrigger value="delivered" onClick={() => setStatusFilter("delivered")}>
              Livrées
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par n° commande ou client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les dates</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Orders List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={order.id}
                className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          {order.id}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("flex items-center gap-1", status.variant)}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{order.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    {status.action && (
                      <Button size="sm">{status.action}</Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Contacter client
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Annuler
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Customer Info */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Client
                    </p>
                    <p className="font-medium text-foreground">
                      {order.customer.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer.address}
                    </p>
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Articles ({order.items.length})
                    </p>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-foreground">
                          {item.qty}x {item.name}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Paiement
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {formatPrice(order.total)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.paymentMethod}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Aucune commande trouvée
            </h3>
            <p className="text-muted-foreground">
              Aucune commande ne correspond à vos critères de recherche
            </p>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
