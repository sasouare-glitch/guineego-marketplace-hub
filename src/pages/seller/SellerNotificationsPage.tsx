import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "order" | "stock" | "message" | "report" | "system";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "order",
    title: "Nouvelle commande #CMD-2847",
    description: "Mamadou Diallo a passé une commande de 3 articles pour 185 000 GNF",
    time: "Il y a 5 min",
    read: false,
  },
  {
    id: "2",
    type: "stock",
    title: "Stock faible — Sac en cuir tressé",
    description: "Il ne reste que 2 unités en stock. Pensez à réapprovisionner.",
    time: "Il y a 30 min",
    read: false,
  },
  {
    id: "3",
    type: "message",
    title: "Nouveau message de Aissatou B.",
    description: "« Bonjour, est-ce que le tissu Bazin est disponible en bleu ? »",
    time: "Il y a 1h",
    read: false,
  },
  {
    id: "4",
    type: "order",
    title: "Commande #CMD-2845 livrée",
    description: "La commande a été livrée avec succès à Kaloum.",
    time: "Il y a 2h",
    read: true,
  },
  {
    id: "5",
    type: "report",
    title: "Rapport hebdomadaire disponible",
    description: "Vos ventes ont augmenté de 12% cette semaine. Consultez le détail.",
    time: "Il y a 5h",
    read: true,
  },
  {
    id: "6",
    type: "system",
    title: "Mise à jour des conditions vendeur",
    description: "Les nouvelles conditions générales de vente entrent en vigueur le 15 mars.",
    time: "Hier",
    read: true,
  },
  {
    id: "7",
    type: "stock",
    title: "Rupture de stock — Huile de palme 1L",
    description: "Ce produit est en rupture. Il a été masqué de la boutique.",
    time: "Hier",
    read: true,
  },
  {
    id: "8",
    type: "order",
    title: "Nouvelle commande #CMD-2843",
    description: "Fatou Camara — 1 article, 45 000 GNF. Paiement Orange Money confirmé.",
    time: "Il y a 2 jours",
    read: true,
  },
];

const typeConfig = {
  order: { icon: ShoppingBag, color: "text-primary", bg: "bg-primary/10", label: "Commandes" },
  stock: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-500/10", label: "Stock" },
  message: { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-500/10", label: "Messages" },
  report: { icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-500/10", label: "Rapports" },
  system: { icon: Bell, color: "text-muted-foreground", bg: "bg-muted", label: "Système" },
};

const SellerNotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [activeTab, setActiveTab] = useState("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications =
    activeTab === "all"
      ? notifications
      : activeTab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.type === activeTab);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

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
