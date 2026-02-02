import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Search } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderHistoryCard, OrderData } from "@/components/orders/OrderHistoryCard";
import { useTranslation } from "@/hooks/useTranslation";

// Mock orders data
const mockOrders: OrderData[] = [
  {
    id: "1",
    orderNumber: "GGO-27850204",
    status: "transit",
    createdAt: "2024-01-15T10:30:00",
    total: 8525000,
    itemCount: 2,
    items: [
      {
        name: "iPhone 13 Pro Max 256GB",
        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200",
        quantity: 1,
      },
      {
        name: "Coque de protection",
        image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=200",
        quantity: 2,
      },
    ],
  },
  {
    id: "2",
    orderNumber: "GGO-27843156",
    status: "delivered",
    createdAt: "2024-01-10T14:20:00",
    total: 1250000,
    itemCount: 3,
    items: [
      {
        name: "Ensemble traditionnel Bazin",
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200",
        quantity: 1,
      },
      {
        name: "Sandales artisanales",
        image: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=200",
        quantity: 1,
      },
      {
        name: "Bracelet en perles",
        image: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=200",
        quantity: 1,
      },
    ],
  },
  {
    id: "3",
    orderNumber: "GGO-27835892",
    status: "delivered",
    createdAt: "2024-01-05T09:15:00",
    total: 450000,
    itemCount: 1,
    items: [
      {
        name: "Casque Bluetooth Sony",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200",
        quantity: 1,
      },
    ],
  },
  {
    id: "4",
    orderNumber: "GGO-27821478",
    status: "cancelled",
    createdAt: "2023-12-28T16:45:00",
    total: 2800000,
    itemCount: 2,
    items: [
      {
        name: "Samsung Galaxy Tab S9",
        image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200",
        quantity: 1,
      },
      {
        name: "Étui de protection",
        image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200",
        quantity: 1,
      },
    ],
  },
  {
    id: "5",
    orderNumber: "GGO-27815634",
    status: "preparing",
    createdAt: "2024-01-16T08:00:00",
    total: 3500000,
    itemCount: 1,
    items: [
      {
        name: "MacBook Air M2",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200",
        quantity: 1,
      },
    ],
  },
];

export default function MyOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { t } = useTranslation();

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active")
      return matchesSearch && ["pending", "preparing", "transit"].includes(order.status);
    if (activeTab === "delivered")
      return matchesSearch && order.status === "delivered";
    if (activeTab === "cancelled")
      return matchesSearch && order.status === "cancelled";

    return matchesSearch;
  });

  const orderCounts = {
    all: mockOrders.length,
    active: mockOrders.filter((o) =>
      ["pending", "preparing", "transit"].includes(o.status)
    ).length,
    delivered: mockOrders.filter((o) => o.status === "delivered").length,
    cancelled: mockOrders.filter((o) => o.status === "cancelled").length,
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
          <p className="text-muted-foreground">
            {t.orders.viewAndTrack}
          </p>
        </motion.div>

        {/* Search and Filter */}
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

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <OrderHistoryCard key={order.id} order={order} index={index} />
            ))}
          </div>
        ) : (
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
