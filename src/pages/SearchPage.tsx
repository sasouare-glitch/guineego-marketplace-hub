import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryBar } from "@/components/marketplace/CategoryBar";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { SearchFilters, FilterState } from "@/components/marketplace/SearchFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, SlidersHorizontal, Grid3X3, List, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useTranslation } from "@/hooks/useTranslation";
import { useAllProducts } from "@/hooks/useAllProducts";

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
  const { products: allProducts, loading } = useAllProducts();
  
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
  }, [allProducts, searchTerm, filters, sortBy]);

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
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
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
