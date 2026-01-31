export interface Notification {
  id: string;
  type: "order_confirmed" | "order_preparing" | "order_shipped" | "order_delivered" | "promo" | "system";
  title: string;
  message: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export const notificationTypeConfig = {
  order_confirmed: {
    icon: "check-circle",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  order_preparing: {
    icon: "package",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  order_shipped: {
    icon: "truck",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  order_delivered: {
    icon: "map-pin",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  promo: {
    icon: "tag",
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
  system: {
    icon: "info",
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
  },
};

// Mock notifications for demo
export const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "order_shipped",
    title: "Commande en livraison",
    message: "Votre commande GGO-27850204 est en route. Livraison prévue entre 14h et 16h.",
    orderId: "GGO-27850204",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
  },
  {
    id: "2",
    type: "order_preparing",
    title: "Commande en préparation",
    message: "Le vendeur prépare votre commande GGO-27815634. Elle sera bientôt expédiée.",
    orderId: "GGO-27815634",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "3",
    type: "promo",
    title: "🎉 Offre spéciale",
    message: "Profitez de -20% sur les téléphones jusqu'à dimanche avec le code MOBILE20",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: "4",
    type: "order_delivered",
    title: "Commande livrée",
    message: "Votre commande GGO-27843156 a été livrée avec succès. Merci pour votre confiance !",
    orderId: "GGO-27843156",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
  {
    id: "5",
    type: "order_confirmed",
    title: "Commande confirmée",
    message: "Votre commande GGO-27821478 a été confirmée. Nous vous tiendrons informé de son avancement.",
    orderId: "GGO-27821478",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
  },
];
