import { motion } from "framer-motion";
import { CheckCircle, Package, Truck, Clock, ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface OrderConfirmationProps {
  orderNumber: string;
  estimatedDelivery: string;
  isGuest?: boolean;
}

export const OrderConfirmation = ({ orderNumber, estimatedDelivery, isGuest = false }: OrderConfirmationProps) => {
  const { t } = useTranslation();

  useEffect(() => {
    // Simple celebration effect without external dependency
    console.log("🎉 Order confirmed!");
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-24 h-24 bg-guinea-green/10 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="w-12 h-12 text-guinea-green" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          {t.checkout.orderConfirmedTitle} 🎉
        </h2>
        <p className="text-muted-foreground mb-6">
          {t.checkout.thankYouOrder}
        </p>
      </motion.div>

      {/* Order Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-2xl border border-border p-6 max-w-md mx-auto mb-8"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <span className="text-muted-foreground">{t.checkout.orderNumber}</span>
            <span className="font-mono font-bold text-foreground">{orderNumber}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-guinea-green/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-guinea-green" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">{t.checkout.preparingOrder}</p>
              <p className="text-sm text-muted-foreground">{t.checkout.packagePreparing}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Truck className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">{t.checkout.estimatedDelivery}</p>
              <p className="text-sm text-guinea-green font-medium">{estimatedDelivery}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tracking Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-secondary/50 rounded-2xl p-6 max-w-md mx-auto mb-8"
      >
        <h3 className="font-semibold text-foreground mb-4 text-left">{t.checkout.orderTracking}</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          {[
            { status: t.checkout.confirmed, time: t.checkout.now, active: true },
            { status: t.checkout.preparing, time: t.checkout.soon, active: false },
            { status: t.checkout.inDelivery, time: "-", active: false },
            { status: t.checkout.delivered, time: "-", active: false }
          ].map((step, index) => (
            <div key={index} className="relative flex items-start gap-4 pb-4 last:pb-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                step.active ? "bg-guinea-green" : "bg-secondary border-2 border-border"
              }`}>
                {step.active ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className={`font-medium ${step.active ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.status}
                </p>
                <p className="text-xs text-muted-foreground">{step.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Guest: Account creation CTA */}
      {isGuest && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-primary/5 border border-primary/20 rounded-2xl p-6 max-w-md mx-auto mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">Créer un compte ?</p>
              <p className="text-sm text-muted-foreground">Suivez vos commandes et gagnez du temps</p>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link to={`/register?redirect=/track/${orderNumber}`}>
              <UserPlus className="w-4 h-4 mr-2" />
              Créer mon compte gratuitement
            </Link>
          </Button>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <Button asChild>
          <Link to={isGuest ? `/track/${orderNumber}` : `/order/${orderNumber}`}>
            {t.checkout.trackOrder}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/marketplace">{t.cart.continueShopping}</Link>
        </Button>
      </motion.div>
    </motion.div>
  );
};
