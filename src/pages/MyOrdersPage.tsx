import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Search, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderHistoryCard, type OrderData, type OrderStatus } from "@/components/orders/OrderHistoryCard";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { safeOnSnapshot } from "@/lib/firebase/safeSnapshot";

const ACTIVE_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "shipped",
  "in_delivery",
];

export default function MyOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { user } = useAuth();

  // Realtime listener on customer orders
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("customerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = safeOnSnapshot(
      q,
      (snap: any) => {
        const docs = snap.docs.map((d: any) => {
          const data = d.data();
          return {
            id: d.id,
            orderNumber: d.id,
            status: (data.status || "pending") as OrderStatus,
            createdAt: data.createdAt || null,
            totalAmount: data.totalAmount || data.pricing?.total || 0,
            items: (data.items || []).map((item: any) => ({
              name: item.name || item.productName || "Article",
              image: item.image || item.imageUrl || "",
              quantity: item.quantity || 1,
              price: item.price || 0,
              productId: item.productId,
            })),
            shippingAddress: data.shippingAddress,
            paymentMethod: data.paymentMethod,
          } as OrderData;
        });
        setOrders(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching orders:", err);
        setLoading(false);
      },
      'myOrders'
    );

    return () => unsub();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.orderNumber || order.id)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      order.items.some((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active")
      return matchesSearch && ACTIVE_STATUSES.includes(order.status);
    if (activeTab === "delivered")
      return matchesSearch && order.status === "delivered";
    if (activeTab === "cancelled")
      return matchesSearch && order.status === "cancelled";

    return matchesSearch;
  });

  const orderCounts = {
    all: orders.length,
    active: orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-tight pt-24 pb-16">
        {/* Back Link */}
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.orders.backToMarketplace}
        </Link>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            {t.orders.title}
          </h1>
          <p className="text-muted-foreground">{t.orders.viewAndTrack}</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t.orders.searchOrder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              {t.orders.allOrders} ({orderCounts.all})
            </TabsTrigger>
            <TabsTrigger value="active">
              {t.orders.activeOrders} ({orderCounts.active})
            </TabsTrigger>
            <TabsTrigger value="delivered">
              {t.orders.deliveredOrders} ({orderCounts.delivered})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              {t.orders.cancelledOrders} ({orderCounts.cancelled})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Orders List */}
        {!loading && filteredOrders.length > 0 && (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <OrderHistoryCard key={order.id} order={order} index={index} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-2">
              {t.orders.noOrderFound}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? t.orders.noMatchingOrder
                : t.orders.noOrdersMessage}
            </p>
            <Button asChild>
              <Link to="/marketplace">{t.cart.discoverProducts}</Link>
            </Button>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
