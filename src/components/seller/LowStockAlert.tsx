import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Package, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { LowStockProduct } from "@/hooks/useSellerDashboard";

interface LowStockAlertProps {
  products: LowStockProduct[];
}

export function LowStockAlert({ products = [] }: LowStockAlertProps) {
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-card rounded-xl border border-border shadow-sm p-6"
      >
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <CheckCircle2 className="w-8 h-8 mb-2 text-primary" />
          <p className="text-sm font-medium text-foreground">Stock OK</p>
          <p className="text-xs">Tous vos produits sont bien approvisionnés</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-card rounded-xl border border-destructive/20 shadow-sm"
    >
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Stock faible</h3>
            <p className="text-sm text-muted-foreground">
              {products.length} produit{products.length > 1 ? 's' : ''} à réapprovisionner
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/seller/products" className="flex items-center gap-1">
            Gérer
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      <div className="divide-y divide-border">
        {products.map((product) => {
          const stockPercentage = Math.min((product.stock / product.minStock) * 100, 100);

          return (
            <Link
              key={product.id}
              to="/seller/products"
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress
                      value={stockPercentage}
                      className="h-1.5 w-20 bg-destructive/20"
                    />
                    <span className="text-xs text-destructive font-medium">
                      {product.stock} restant{product.stock > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-xs">
                Réapprovisionner
              </Button>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
