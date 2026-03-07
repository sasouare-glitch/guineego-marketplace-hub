import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  MoreVertical,
  Eye,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  Download,
  ChefHat,
  ShoppingBag,
  Loader2,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
  setDoc,
  addDoc,
  arrayUnion,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { toast } from "sonner";

// -- Types matching backend --
type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "shipped"
  | "in_delivery"
  | "delivered"
  | "cancelled";

interface FirestoreOrder {
  id: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: any;
  items: { name: string; quantity: number; price: number; productId?: string }[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod?: string;
  createdAt?: Timestamp;
  sellerIds?: string[];
  sellerId?: string;
}

// -- Status config aligned with backend flow --
const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    icon: React.ElementType;
    variant: string;
    sellerAction: string | null;
    nextStatus: OrderStatus | null;
  }
> = {
  pending: {
    label: "En attente",
    icon: Clock,
    variant: "bg-accent/10 text-accent border-accent/20",
    sellerAction: "Confirmer",
    nextStatus: "confirmed",
  },
  confirmed: {
    label: "Confirmée",
    icon: CheckCircle2,
    variant: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    sellerAction: "Commencer préparation",
    nextStatus: "preparing",
  },
  preparing: {
    label: "En préparation",
    icon: ChefHat,
    variant: "bg-primary/10 text-primary border-primary/20",
    sellerAction: "Marquer prête",
    nextStatus: "ready",
  },
  ready: {
    label: "Prête",
    icon: ShoppingBag,
    variant: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    sellerAction: "Expédier",
    nextStatus: "shipped",
  },
  shipped: {
    label: "Colis récupéré",
    icon: Package,
    variant: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    sellerAction: null,
    nextStatus: null,
  },
  in_delivery: {
    label: "En livraison",
    icon: Truck,
    variant: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    sellerAction: null,
    nextStatus: null,
  },
  delivered: {
    label: "Livrée",
    icon: CheckCircle2,
    variant: "bg-primary/10 text-primary border-primary/20",
    sellerAction: null,
    nextStatus: null,
  },
  cancelled: {
    label: "Annulée",
    icon: XCircle,
    variant: "bg-destructive/10 text-destructive border-destructive/20",
    sellerAction: null,
    nextStatus: null,
  },
};

const formatPrice = (price: number) =>
  price.toLocaleString("fr-GN") + " GNF";

const formatDate = (ts?: Timestamp) => {
  if (!ts) return "";
  const d = ts.toDate();
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function SellerOrders() {
  const { user, claims } = useAuth();
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    orderId: string;
    nextStatus: OrderStatus;
    label: string;
  }>({ open: false, orderId: "", nextStatus: "confirmed", label: "" });

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch seller orders from Firestore in realtime
  useEffect(() => {
    if (!user) return;

    const sellerId = (claims as any)?.ecommerceId || user.uid;

    // Query orders where this seller is involved
    const q = query(
      collection(db, "orders"),
      where("sellerIds", "array-contains", sellerId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            totalAmount: data.totalAmount || data.pricing?.total || 0,
          };
        }) as FirestoreOrder[];
        setOrders(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching seller orders:", err);
        // Fallback: try with sellerId field
        const q2 = query(
          collection(db, "orders"),
          where("sellerId", "==", sellerId),
          orderBy("createdAt", "desc")
        );
        onSnapshot(q2, (snap) => {
          const docs = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              totalAmount: data.totalAmount || data.pricing?.total || 0,
            };
          }) as FirestoreOrder[];
          setOrders(docs);
          setLoading(false);
        });
      }
    );

    return () => unsub();
  }, [user, claims]);

  // Update order status directly in Firestore
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const orderRef = doc(db, "orders", orderId);
      const statusEntry = {
        status: newStatus,
        timestamp: Timestamp.now(),
        performedBy: user!.uid,
        role: "ecommerce",
        note: null,
      };

      // Auto-create delivery mission when seller ships the order
      // Use a batch write so order + delivery are created atomically
      if (newStatus === "shipped") {
        const order = orders.find((o) => o.id === orderId);
        if (order) {
          const batch = writeBatch(db);

          const missionTimestamp = Date.now().toString(36).toUpperCase();
          const missionRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
          const missionId = `MIS-${missionTimestamp}${missionRandom}`;

          const sellerAddress = {
            address: "Adresse du vendeur",
            commune: order.shippingAddress?.commune || "Kaloum",
            phone: user?.phoneNumber || "",
          };

          const deliveryCommune = order.shippingAddress?.commune || "Kaloum";
          const baseFees: Record<string, number> = {
            Kaloum: 15000, Dixinn: 20000, Matam: 20000, Ratoma: 25000, Matoto: 30000,
          };
          const fee = baseFees[deliveryCommune] || 35000;

          // Create delivery mission document
          const deliveryRef = doc(collection(db, "deliveries"));
          batch.set(deliveryRef, {
            id: missionId,
            orderId,
            customerId: order.customerId,
            sellerIds: order.sellerIds || [order.sellerId],
            pickup: sellerAddress,
            delivery: order.shippingAddress,
            priority: "normal",
            fee,
            estimatedTime: 60,
            status: "pending",
            assignedCourier: null,
            courierLocation: null,
            statusHistory: [
              {
                status: "pending",
                timestamp: Timestamp.now(),
                note: "Mission créée par le vendeur",
              },
            ],
            createdAt: serverTimestamp(),
          });

          // Update order status + link mission
          batch.update(orderRef, {
            status: newStatus,
            statusHistory: arrayUnion(statusEntry),
            deliveryMissionId: missionId,
            updatedAt: serverTimestamp(),
          });

          await batch.commit();
          toast.success("Commande expédiée et mission de livraison créée !");
        }
      } else {
        await updateDoc(orderRef, {
          status: newStatus,
          statusHistory: arrayUnion(statusEntry),
          updatedAt: serverTimestamp(),
        });
        toast.success(`Commande mise à jour: ${statusConfig[newStatus].label}`);
      }

      // Optimistically update the local order status so the filter works immediately
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      // Switch to the new status tab so the progress bar is visible
      setStatusFilter(newStatus);
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingId(null);
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  const openConfirmDialog = (
    orderId: string,
    nextStatus: OrderStatus,
    label: string
  ) => {
    setConfirmDialog({ open: true, orderId, nextStatus, label });
  };

  // Filtering
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const countByStatus = (s: OrderStatus) =>
    orders.filter((o) => o.status === s).length;

  const pendingCount = countByStatus("pending");
  const confirmedCount = countByStatus("confirmed");
  const preparingCount = countByStatus("preparing");
  const readyCount = countByStatus("ready");

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
              {confirmedCount > 0 && (
                <span className="text-emerald-600 font-medium">
                  {confirmedCount} confirmées •{" "}
                </span>
              )}
              {preparingCount > 0 && (
                <span className="text-primary font-medium">
                  {preparingCount} en préparation •{" "}
                </span>
              )}
              {readyCount > 0 && (
                <span className="text-blue-600 font-medium">
                  {readyCount} prêtes
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
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="space-y-4">
          <TabsList className="bg-muted/50 p-1 flex-wrap">
            <TabsTrigger value="all">
              Toutes ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              En attente ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Confirmées ({confirmedCount})
            </TabsTrigger>
            <TabsTrigger value="preparing">
              En préparation ({preparingCount})
            </TabsTrigger>
            <TabsTrigger value="ready">
              Prêtes ({readyCount})
            </TabsTrigger>
            <TabsTrigger value="shipped">
              Expédiées
            </TabsTrigger>
            <TabsTrigger value="delivered">
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Orders List */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filteredOrders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const isUpdating = updatingId === order.id;

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
                            className={cn(
                              "flex items-center gap-1",
                              status.variant
                            )}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 sm:mt-0">
                      {/* Status action button */}
                      {status.sellerAction && status.nextStatus && (
                        <Button
                          size="sm"
                          disabled={isUpdating}
                          onClick={() =>
                            openConfirmDialog(
                              order.id,
                              status.nextStatus!,
                              status.sellerAction!
                            )
                          }
                        >
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : null}
                          {status.sellerAction}
                        </Button>
                      )}

                      {/* After shipped: waiting for courier pickup */}
                      {order.status === "shipped" && (
                        <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                          <Truck className="w-3 h-3 mr-1" />
                          Coursier en route
                        </Badge>
                      )}
                      {order.status === "in_delivery" && (
                        <Badge variant="outline" className="text-violet-600 border-violet-200">
                          <Truck className="w-3 h-3 mr-1" />
                          En cours de livraison
                        </Badge>
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
                          {(order.status === "pending" ||
                            order.status === "confirmed") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive flex items-center gap-2"
                                onClick={() =>
                                  openConfirmDialog(
                                    order.id,
                                    "cancelled",
                                    "Annuler la commande"
                                  )
                                }
                              >
                                <XCircle className="w-4 h-4" />
                                Annuler
                              </DropdownMenuItem>
                            </>
                          )}
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
                        {order.customerName || "Client"}
                      </p>
                      {order.customerPhone && (
                        <p className="text-sm text-muted-foreground">
                          {order.customerPhone}
                        </p>
                      )}
                      {order.shippingAddress && (
                        <p className="text-sm text-muted-foreground">
                          {order.shippingAddress.commune || order.shippingAddress.city || ""}
                          {order.shippingAddress.commune ? ", Conakry" : ""}
                        </p>
                      )}
                    </div>

                    {/* Items */}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                        Articles ({order.items?.length || 0})
                      </p>
                      <div className="space-y-1">
                        {order.items?.map((item, idx) => (
                          <p key={idx} className="text-sm text-foreground">
                            {item.quantity}x {item.name}
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
                        {formatPrice(order.totalAmount || 0)}
                      </p>
                      {order.paymentMethod && (
                        <p className="text-sm text-muted-foreground">
                          {order.paymentMethod}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress bar for seller-actionable statuses */}
                  {["pending", "confirmed", "preparing", "ready"].includes(order.status) && (
                    <div className="px-4 pb-4">
                      <div className="flex items-center gap-1">
                        {["pending", "confirmed", "preparing", "ready"].map(
                          (s, i) => {
                            const currentIdx = ["pending", "confirmed", "preparing", "ready"].indexOf(order.status);
                            const isCompleted = i <= currentIdx;
                            return (
                              <div
                                key={s}
                                className={cn(
                                  "h-1.5 flex-1 rounded-full transition-colors",
                                  isCompleted ? "bg-primary" : "bg-muted"
                                )}
                              />
                            );
                          }
                        )}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">Reçue</span>
                        <span className="text-[10px] text-muted-foreground">Confirmée</span>
                        <span className="text-[10px] text-muted-foreground">Préparation</span>
                        <span className="text-[10px] text-muted-foreground">Prête</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
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

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'action</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment{" "}
              <strong className="text-foreground">{confirmDialog.label?.toLowerCase()}</strong>{" "}
              cette commande ?
              {confirmDialog.nextStatus === "ready" && (
                <span className="block mt-2 text-blue-600">
                  Une mission de livraison sera automatiquement créée pour un coursier.
                </span>
              )}
              {confirmDialog.nextStatus === "cancelled" && (
                <span className="block mt-2 text-destructive">
                  Cette action est irréversible.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                handleStatusChange(
                  confirmDialog.orderId,
                  confirmDialog.nextStatus
                )
              }
              className={
                confirmDialog.nextStatus === "cancelled"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {updatingId ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SellerLayout>
  );
}
