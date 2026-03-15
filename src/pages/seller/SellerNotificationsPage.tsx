import { useState, useEffect, useCallback } from "react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  ShoppingBag,
  Package,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  CheckCheck,
  Trash2,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface SellerNotification {
  id: string;
  type: "order" | "stock" | "message" | "report" | "system";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const typeConfig = {
  order: { icon: ShoppingBag, color: "text-primary", bg: "bg-primary/10", label: "Commandes" },
  stock: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-500/10", label: "Stock" },
  message: { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-500/10", label: "Messages" },
  report: { icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-500/10", label: "Rapports" },
  system: { icon: Bell, color: "text-muted-foreground", bg: "bg-muted", label: "Système" },
};

// Map Firestore notification types to local seller types
function mapNotificationType(type: string): SellerNotification["type"] {
  if (type.includes("order") || type === "order_created" || type === "order_status_changed") return "order";
  if (type.includes("stock") || type === "low_stock") return "stock";
  if (type.includes("message") || type === "new_message") return "message";
  if (type.includes("report") || type.includes("revenue") || type === "sponsoring_expiring") return "report";
  return "system";
}

const SellerNotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Real-time Firestore listener
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs: SellerNotification[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const createdAt = data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : data.createdAt ? new Date(data.createdAt) : new Date();

          return {
            id: docSnap.id,
            type: mapNotificationType(data.type || "system"),
            title: data.title || "",
            description: data.message || data.body || "",
            time: formatDistanceToNow(createdAt, { addSuffix: true, locale: fr }),
            read: data.read ?? false,
          };
        });
        setNotifications(notifs);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to seller notifications:", error);
        setLoading(false);
      }
    );

    return () => {
      try { unsubscribe(); } catch (e) { console.warn(e); }
    };
  }, [user?.uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications =
    activeTab === "all"
      ? notifications
      : activeTab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.type === activeTab);

  const markAllRead = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const batch = writeBatch(db);
      notifications.filter((n) => !n.read).forEach((n) => {
        batch.update(doc(db, "notifications", n.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [user?.uid, notifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                : "Toutes les notifications sont lues"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">
              Tout
              {notifications.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs">{notifications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Non lues
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1.5 text-xs">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="order">Commandes</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="message">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {activeTab === "all"
                    ? "Toutes les notifications"
                    : activeTab === "unread"
                    ? "Non lues"
                    : typeConfig[activeTab as keyof typeof typeConfig]?.label || "Notifications"}
                </CardTitle>
                <CardDescription>
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">Aucune notification</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredNotifications.map((notification) => {
                      const config = typeConfig[notification.type];
                      const Icon = config.icon;
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/50 cursor-pointer group",
                            !notification.read && "bg-primary/[0.03]"
                          )}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className={cn("rounded-lg p-2.5 mt-0.5 flex-shrink-0", config.bg)}>
                            <Icon className={cn("h-4 w-4", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn("text-sm font-medium text-foreground", !notification.read && "font-semibold")}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.description}
                            </p>
                            <div className="flex items-center gap-1 mt-1.5">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{notification.time}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SellerLayout>
  );
};

export default SellerNotificationsPage;
