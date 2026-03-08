import { useState, useEffect } from "react";
import { ChevronDown, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  rating: number | null;
  inStock: boolean;
  sellers: string[];
}

interface SellerOption {
  id: string;
  label: string;
}

interface SearchFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  /** Product counts per sellerId for display */
  sellerProductCounts?: Record<string, number>;
}

import { CATEGORIES } from "@/constants/categories";

const categories = CATEGORIES.map((c) => ({ id: c.id, label: c.label }));

const ratings = [4, 3, 2, 1];

export const SearchFilters = ({ filters, onFiltersChange, onClearFilters, sellerProductCounts = {} }: SearchFiltersProps) => {
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [openSections, setOpenSections] = useState({
    categories: true,
    price: true,
    rating: false,
    sellers: false,
  });

  // Fetch sellers from Firestore
  useEffect(() => {
    setLoadingSellers(true);
    getDocs(collection(db, "seller_settings")).then((snap) => {
      const list: SellerOption[] = [];
      snap.docs.forEach((d) => {
        const data = d.data();
        const name = data.shopName || data.storeName || data.name;
        if (name) {
          list.push({ id: data.userId || d.id, label: name });
        }
      });
      // Fallback: also check 'sellers' collection
      if (list.length === 0) {
        getDocs(collection(db, "sellers")).then((sellersSnap) => {
          sellersSnap.docs.forEach((d) => {
            const data = d.data();
            const name = data.shopName || data.storeName || data.businessName || data.name;
            if (name) {
              list.push({ id: data.userId || d.id, label: name });
            }
          });
          setSellers(list);
          setLoadingSellers(false);
        });
      } else {
        setSellers(list);
        setLoadingSellers(false);
      }
    }).catch(() => setLoadingSellers(false));
  }, []);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: "categories" | "sellers", value: string) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const activeFiltersCount = 
    filters.categories.length + 
    filters.sellers.length + 
    (filters.rating ? 1 : 0) + 
    (filters.inStock ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000000 ? 1 : 0);

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
    return price.toString();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold">Filtres</h3>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-guinea-red">
            <X className="w-4 h-4 mr-1" />
            Effacer ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* In Stock */}
      <div className="flex items-center space-x-2 py-2 border-b border-border">
        <Checkbox
          id="inStock"
          checked={filters.inStock}
          onCheckedChange={(checked) => updateFilter("inStock", checked as boolean)}
        />
        <label htmlFor="inStock" className="text-sm font-medium cursor-pointer">
          En stock uniquement
        </label>
      </div>

      {/* Categories */}
      <Collapsible open={openSections.categories} onOpenChange={() => toggleSection("categories")}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b border-border">
          <span className="font-medium">Catégories</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", openSections.categories && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={category.id}
                  checked={filters.categories.includes(category.id)}
                  onCheckedChange={() => toggleArrayFilter("categories", category.id)}
                />
                <label htmlFor={category.id} className="text-sm cursor-pointer">
                  {category.label}
                </label>
              </div>
              
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Price Range */}
      <Collapsible open={openSections.price} onOpenChange={() => toggleSection("price")}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b border-border">
          <span className="font-medium">Prix</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", openSections.price && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 px-1">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => updateFilter("priceRange", value as [number, number])}
            max={100000000}
            min={0}
            step={500000}
            className="mb-4"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{formatPrice(filters.priceRange[0])} GNF</span>
            <span className="text-muted-foreground">{formatPrice(filters.priceRange[1])} GNF</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Rating */}
      <Collapsible open={openSections.rating} onOpenChange={() => toggleSection("rating")}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b border-border">
          <span className="font-medium">Note minimale</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", openSections.rating && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-2">
          {ratings.map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={filters.rating === rating}
                onCheckedChange={(checked) => updateFilter("rating", checked ? rating : null)}
              />
              <label htmlFor={`rating-${rating}`} className="flex items-center gap-1 text-sm cursor-pointer">
                {rating}+ étoiles
                <span className="text-guinea-yellow">★</span>
              </label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Sellers */}
      <Collapsible open={openSections.sellers} onOpenChange={() => toggleSection("sellers")}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b border-border">
          <span className="font-medium">Vendeurs</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", openSections.sellers && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-2">
          {loadingSellers ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
            </div>
          ) : sellers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun vendeur</p>
          ) : (
            sellers.map((seller) => {
              const count = sellerProductCounts[seller.id] || 0;
              return (
                <div key={seller.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`seller-${seller.id}`}
                      checked={filters.sellers.includes(seller.id)}
                      onCheckedChange={() => toggleArrayFilter("sellers", seller.id)}
                    />
                    <label htmlFor={`seller-${seller.id}`} className="text-sm cursor-pointer">
                      {seller.label}
                    </label>
                  </div>
                  {count > 0 && (
                    <span className="text-xs text-muted-foreground">({count})</span>
                  )}
                </div>
              );
            })
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
