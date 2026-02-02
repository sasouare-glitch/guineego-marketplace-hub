import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryBar } from "@/components/marketplace/CategoryBar";
import { ProductCard, Product } from "@/components/marketplace/ProductCard";
import { SearchFilters, FilterState } from "@/components/marketplace/SearchFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search as SearchIcon, SlidersHorizontal, Grid3X3, List, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useTranslation } from "@/hooks/useTranslation";

// All products for search
const allProducts: Product[] = [
  {
    id: "1",
    name: "iPhone 13 Pro Max 256GB - Graphite",
    price: 8500000,
    originalPrice: 11000000,
    image: "https://images.unsplash.com/photo-1632661674596-df8be59a8a35?w=400",
    rating: 4.8,
    reviewCount: 234,
    seller: "TechShop GN",
    category: "electronics",
    inStock: true,
    discount: 23,
    isBestSeller: true,
  },
  {
    id: "2",
    name: "Samsung Galaxy S23 Ultra 512GB",
    price: 7200000,
    originalPrice: 9000000,
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400",
    rating: 4.7,
    reviewCount: 189,
    seller: "MobilePlus",
    category: "electronics",
    inStock: true,
    discount: 20,
  },
  {
    id: "3",
    name: "MacBook Air M2 13 pouces",
    price: 12500000,
    originalPrice: 15000000,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    rating: 4.9,
    reviewCount: 156,
    seller: "TechShop GN",
    category: "electronics",
    inStock: true,
    discount: 17,
    isNew: true,
  },
  {
    id: "4",
    name: "AirPods Pro 2ème génération",
    price: 1800000,
    originalPrice: 2200000,
    image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400",
    rating: 4.6,
    reviewCount: 312,
    seller: "AudioWorld",
    category: "electronics",
    inStock: true,
    discount: 18,
  },
  {
    id: "5",
    name: "Robe traditionnelle africaine brodée",
    price: 450000,
    image: "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400",
    rating: 4.5,
    reviewCount: 78,
    seller: "Mode Africaine",
    category: "fashion",
    inStock: true,
    isNew: true,
  },
  {
    id: "6",
    name: "Montre connectée Huawei Watch GT3",
    price: 980000,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    rating: 4.4,
    reviewCount: 92,
    seller: "TechShop GN",
    category: "electronics",
    inStock: true,
    isNew: true,
  },
  {
    id: "7",
    name: "Sac à main en cuir authentique",
    price: 320000,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400",
    rating: 4.3,
    reviewCount: 45,
    seller: "Luxe Boutique",
    category: "fashion",
    inStock: true,
    isNew: true,
  },
  {
    id: "8",
    name: "Parfum Homme - Collection Premium",
    price: 280000,
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400",
    rating: 4.7,
    reviewCount: 134,
    seller: "Beauty World",
    category: "beauty",
    inStock: true,
    isNew: true,
  },
  {
    id: "9",
    name: "Ensemble cuisine 10 pièces inox",
    price: 650000,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
    rating: 4.6,
    reviewCount: 267,
    seller: "Home Plus",
    category: "home",
    inStock: true,
    isBestSeller: true,
  },
  {
    id: "10",
    name: "Tapis persan 200x300cm",
    price: 1200000,
    image: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400",
    rating: 4.8,
    reviewCount: 89,
    seller: "Déco Maison",
    category: "home",
    inStock: true,
    isBestSeller: true,
  },
  {
    id: "11",
    name: "Chaussures sport Nike Air Max",
    price: 750000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    rating: 4.5,
    reviewCount: 423,
    seller: "Sport Zone",
    category: "sports",
    inStock: true,
    isBestSeller: true,
  },
  {
    id: "12",
    name: "Coffret maquillage professionnel",
    price: 180000,
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400",
    rating: 4.4,
    reviewCount: 198,
    seller: "Beauty World",
    category: "beauty",
    inStock: true,
    isBestSeller: true,
  },
  {
    id: "13",
    name: "Télévision LED 55 pouces 4K",
    price: 4500000,
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400",
    rating: 4.5,
    reviewCount: 67,
    seller: "TechShop GN",
    category: "electronics",
    inStock: false,
  },
  {
    id: "14",
    name: "Cafetière automatique Delonghi",
    price: 890000,
    image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400",
    rating: 4.6,
    reviewCount: 145,
    seller: "Home Plus",
    category: "home",
    inStock: true,
  },
  {
    id: "15",
    name: "Baskets running Adidas Ultraboost",
    price: 680000,
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400",
    rating: 4.7,
    reviewCount: 289,
    seller: "Sport Zone",
    category: "sports",
    inStock: true,
  },
  {
    id: "16",
    name: "Set de valises voyage 3 pièces",
    price: 520000,
    image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=400",
    rating: 4.3,
    reviewCount: 56,
    seller: "Travel Store",
    category: "fashion",
    inStock: true,
  },
];

const defaultFilters: FilterState = {
  categories: [],
  priceRange: [0, 5000000],
  rating: null,
  inStock: false,
  sellers: [],
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();
  const { t } = useTranslation();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState<FilterState>(() => {
    const category = searchParams.get("category");
    return {
      ...defaultFilters,
      categories: category ? [category] : [],
    };
  });
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    let result = allProducts.filter((product) => {
      // Search term
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Categories
      if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
        return false;
      }

      // Price range
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false;
      }

      // Rating
      if (filters.rating && product.rating < filters.rating) {
        return false;
      }

      // In stock
      if (filters.inStock && !product.inStock) {
        return false;
      }

      return true;
    });

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
    }

    return result;
  }, [searchTerm, filters, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchTerm });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setSearchTerm("");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryBar activeCategory={filters.categories[0]} />

      <main className="container-tight py-6">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t.search.placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 h-12 text-base"
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setSearchTerm("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>

        <div className="flex gap-6">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-card rounded-xl border border-border p-4">
              <SearchFilters
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={clearFilters}
              />
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{filteredProducts.length}</span> {t.search.productsFound}
              </p>

              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      {t.search.filters}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 bg-card">
                    <SheetHeader>
                      <SheetTitle>{t.search.filters}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <SearchFilters
                        filters={filters}
                        onFiltersChange={(newFilters) => {
                          setFilters(newFilters);
                        }}
                        onClearFilters={() => {
                          clearFilters();
                          setIsFilterOpen(false);
                        }}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder={t.search.sortBy} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="relevance">{t.search.relevance}</SelectItem>
                    <SelectItem value="price-asc">{t.search.priceAsc}</SelectItem>
                    <SelectItem value="price-desc">{t.search.priceDesc}</SelectItem>
                    <SelectItem value="rating">{t.search.bestRating}</SelectItem>
                    <SelectItem value="newest">{t.search.newest}</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="hidden sm:flex items-center border border-border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-r-none"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-l-none"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "space-y-4"
                }
              >
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => addItem(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg font-medium mb-2">{t.search.noResults}</p>
                <p className="text-muted-foreground mb-6">
                  {t.search.tryDifferent}
                </p>
                <Button onClick={clearFilters}>{t.search.clearFilters}</Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
