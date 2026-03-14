import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCircle,
  Package,
  Truck,
  MapPin,
  Tag,
  Info,
  Check,
  Trash2,
  X,
  Megaphone,
  RefreshCw,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/useNotifications";
import { Notification, notificationTypeConfig } from "@/types/notifications";
import { cn } from "@/lib/utils";

const iconMap = {
  "check-circle": CheckCircle,
  package: Package,
  truck: Truck,
  "map-pin": MapPin,
  tag: Tag,
  info: Info,
  megaphone: Megaphone,
};

function NotificationItem({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: () => void;
  onDelete: () => void;
}) {
  const config = notificationTypeConfig[notification.type];
  const Icon = iconMap[config.icon as keyof typeof iconMap];

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  const content = (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        "flex gap-3 p-3 rounded-lg transition-colors group relative",
        notification.read ? "bg-transparent" : "bg-primary/5"
      )}
    >
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", config.bgColor)}>
        <Icon className={cn("w-5 h-5", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("font-medium text-sm", notification.read ? "text-foreground" : "text-foreground")}>
            {notification.title}
          </p>
          {!notification.read && (
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {getTimeAgo(notification.createdAt)}
        </p>
        {notification.type === "sponsoring_expiring" && notification.data?.productId && (
          <Link
            to={`/seller/products?sponsor=${notification.data.productId}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Renouveler le sponsoring
          </Link>
        )}
      </div>
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        {!notification.read && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRead();
            }}
            className="p-1 hover:bg-secondary rounded"
            title="Marquer comme lu"
          >
            <Check className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-destructive/10 rounded"
          title="Supprimer"
        >
          <Trash2 className="w-3 h-3 text-destructive" />
        </button>
      </div>
    </motion.div>
  );

  if (notification.orderId) {
    return (
      <Link to={`/order/${notification.orderId}`} onClick={onRead}>
        {content}
      </Link>
    );
  }

  return content;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    requestPermission,
    permissionStatus,
  } = useNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-foreground/70 hover:text-primary transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-guinea-red text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Tout lire
              </Button>
            )}
          </div>
        </div>

        {/* Permission Banner */}
        {permissionStatus !== "granted" && (
          <div className="p-3 bg-primary/5 border-b border-border">
            <p className="text-xs text-muted-foreground mb-2">
              Activez les notifications pour recevoir les mises à jour de livraison
            </p>
            <Button size="sm" variant="outline" onClick={requestPermission} className="w-full">
              <Bell className="w-4 h-4 mr-2" />
              Activer les notifications
            </Button>
          </div>
        )}

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length > 0 ? (
            <div className="p-2">
              <AnimatePresence mode="popLayout">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={() => markAsRead(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">Aucune notification</p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={clearAll}
              >
                Effacer tout
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
