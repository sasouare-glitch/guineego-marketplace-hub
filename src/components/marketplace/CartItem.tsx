import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export interface CartItemData {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
  seller: string;
  sellerId?: string;
  inStock: boolean;
  maxQuantity: number;
}

interface CartItemProps {
  item: CartItemData;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export const CartItem = ({ item, onUpdateQuantity, onRemove }: CartItemProps) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-GN') + ' GNF';
  };

  return (
    <div className="flex gap-4 py-4 border-b border-border last:border-0">
      {/* Image */}
      <Link to={`/product/${item.productId}`} className="flex-shrink-0">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-muted">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={`/product/${item.productId}`}>
              <h3 className="font-medium text-sm sm:text-base line-clamp-2 hover:text-primary transition-colors">
                {item.name}
              </h3>
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vendu par {item.seller}
            </p>
            {item.variant && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.variant}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-muted-foreground hover:text-guinea-red"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Price and Quantity */}
        <div className="flex items-end justify-between mt-3">
          <div className="flex items-center gap-1 bg-muted rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              disabled={item.quantity >= item.maxQuantity}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <div className="text-right">
            <p className="font-display font-bold text-guinea-green">
              {formatPrice(item.price * item.quantity)}
            </p>
            {item.quantity > 1 && (
              <p className="text-xs text-muted-foreground">
                {formatPrice(item.price)} / unité
              </p>
            )}
          </div>
        </div>

        {/* Stock Warning */}
        {!item.inStock && (
          <p className="text-xs text-guinea-red mt-2">
            Ce produit n'est plus disponible
          </p>
        )}
        {item.inStock && item.quantity >= item.maxQuantity && (
          <p className="text-xs text-guinea-yellow mt-2">
            Quantité maximale atteinte ({item.maxQuantity} disponibles)
          </p>
        )}
      </div>
    </div>
  );
};
