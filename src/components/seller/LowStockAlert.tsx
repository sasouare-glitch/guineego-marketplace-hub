import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  image?: string;
}

const lowStockProducts: LowStockProduct[] = [
  {
    id: "1",
    name: "iPhone 15 Pro Max 256GB",
    stock: 2,
    minStock: 10,
  },
  {
    id: "2",
    name: "Samsung Galaxy S24 Ultra",
    stock: 3,
    minStock: 10,
  },
  {
    id: "3",
    name: "MacBook Air M3 13\"",
    stock: 1,
    minStock: 5,
  },
];

export function LowStockAlert() {
  if (lowStockProducts.length === 0) return null;

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
            <h3 className="text-lg font-semibold text-foreground">
              Stock faible
            </h3>
            <p className="text-sm text-muted-foreground">
              {lowStockProducts.length} produits à réapprovisionner
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/seller/products?filter=low-stock" className="flex items-center gap-1">
            Gérer
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      <div className="divide-y divide-border">
        {lowStockProducts.map((product) => {
          const stockPercentage = (product.stock / product.minStock) * 100;

          return (
            <Link
              key={product.id}
              to={`/seller/products/${product.id}`}
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
                      {product.stock} restants
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
