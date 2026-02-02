import { motion } from "framer-motion";
import { Truck, Shield } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useTranslation } from "@/hooks/useTranslation";

interface OrderSummaryProps {
  deliveryFee?: number;
}

export const OrderSummary = ({ deliveryFee = 25000 }: OrderSummaryProps) => {
  const { items, subtotal } = useCart();
  const { t } = useTranslation();
  const total = subtotal + deliveryFee;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden sticky top-24"
    >
      <div className="p-6 border-b border-border">
        <h3 className="font-display font-semibold text-foreground">{t.checkout.orderSummary}</h3>
      </div>

      {/* Cart Items */}
      <div className="p-6 border-b border-border max-h-64 overflow-y-auto">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-secondary">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm line-clamp-2">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.product.quantity}: {item.quantity}</p>
                <p className="text-sm font-semibold text-primary mt-1">
                  {(item.price * item.quantity).toLocaleString()} GNF
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="p-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.cart.subtotal} ({items.length} {t.checkout.items})</span>
          <span className="font-medium text-foreground">{subtotal.toLocaleString()} GNF</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.cart.delivery}</span>
          <span className="font-medium text-foreground">{deliveryFee.toLocaleString()} GNF</span>
        </div>
        <div className="h-px bg-border my-4" />
        <div className="flex justify-between">
          <span className="font-semibold text-foreground">{t.cart.total}</span>
          <span className="text-xl font-bold text-primary">{total.toLocaleString()} GNF</span>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="px-6 pb-6 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-guinea-green/10 flex items-center justify-center">
            <Truck className="w-4 h-4 text-guinea-green" />
          </div>
          <div>
            <p className="font-medium text-foreground">{t.checkout.expressDelivery}</p>
            <p className="text-xs text-muted-foreground">{t.checkout.deliveryTime}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-guinea-yellow/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-guinea-yellow" />
          </div>
          <div>
            <p className="font-medium text-foreground">{t.checkout.securePayment}</p>
            <p className="text-xs text-muted-foreground">{t.checkout.encryptedData}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
