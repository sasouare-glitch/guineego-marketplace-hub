import { Heart, Megaphone, ShoppingCart, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  seller: string;
  sellerId?: string;
  category: string;
  inStock: boolean;
  discount?: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  isSponsored?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isInWishlist?: boolean;
}

export const ProductCard = ({ 
  product, 
  onAddToCart, 
  onToggleWishlist,
  isInWishlist = false 
}: ProductCardProps) => {
  const { format } = useCurrency();
  const { t } = useTranslation();

  return (
    <Card className="group overflow-hidden bg-card border-border hover:shadow-xl transition-all duration-300">
      {/* Image Container */}
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discount && (
            <Badge className="bg-guinea-red text-white text-xs font-bold">
              -{product.discount}%
            </Badge>
          )}
          {product.isNew && (
            <Badge className="bg-guinea-green text-white text-xs">
              Nouveau
            </Badge>
          )}
          {product.isBestSeller && (
            <Badge className="bg-guinea-yellow text-foreground text-xs">
              Best-seller
            </Badge>
          )}
          {product.isSponsored && (
            <Badge className="bg-accent/90 text-accent-foreground text-xs gap-0.5">
              <Megaphone className="w-3 h-3" />
              Sponsorisé
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-sm",
            isInWishlist && "text-guinea-red"
          )}
          onClick={(e) => {
            e.preventDefault();
            onToggleWishlist?.(product);
          }}
        >
          <Heart className={cn("w-4 h-4", isInWishlist && "fill-current")} />
        </Button>

        {/* Quick Add to Cart */}
        {product.inStock && (
          <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Button
              className="w-full bg-guinea-green hover:bg-guinea-green/90 text-white gap-2"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onAddToCart?.(product);
              }}
            >
              <ShoppingCart className="w-4 h-4" />
              {t.marketplace.addToCart}
            </Button>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary" className="bg-white text-foreground">
              {t.marketplace.outOfStock}
            </Badge>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-3">
        {/* Seller */}
        <p className="text-xs text-muted-foreground truncate mb-1">
          {product.seller}
        </p>

        {/* Name */}
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1.5">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3 h-3",
                  i < Math.floor(product.rating)
                    ? "fill-guinea-yellow text-guinea-yellow"
                    : "text-muted"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display font-bold text-lg text-guinea-green">
            {format(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {format(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
