import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Tag } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard, type Product } from "@/components/marketplace/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllProducts } from "@/hooks/useAllProducts";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

export default function PromosPage() {
  const { products, loading } = useAllProducts();
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();

  const promos = useMemo(() => {
    return (products as Product[])
      .filter((p) => (p.discount && p.discount > 0) || (p.originalPrice && p.originalPrice > p.price))
      .sort((a, b) => (b.discount || 0) - (a.discount || 0));
  }, [products]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 lg:pt-32">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-guinea-red via-guinea-red/90 to-orange-500 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl" />
          </div>
          <div className="container-tight relative py-12 lg:py-20 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur mb-6"
            >
              <Flame className="w-8 h-8" />
            </motion.div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Promotions & Ventes Flash
            </h1>
            <p className="text-white/90 max-w-2xl mx-auto text-lg">
              Profitez des meilleures réductions sur une sélection de produits.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-semibold">
              <Tag className="w-4 h-4" />
              {promos.length} {promos.length > 1 ? "offres disponibles" : "offre disponible"}
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="container-tight py-10 lg:py-16">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
              ))}
            </div>
          ) : promos.length === 0 ? (
            <div className="text-center py-16">
              <Tag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold mb-2">Aucune promotion en cours</h2>
              <p className="text-muted-foreground">Revenez bientôt pour découvrir nos prochaines offres.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {promos.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={() =>
                    addItem({
                      id: p.id,
                      name: p.name,
                      price: p.price,
                      image: p.image,
                      seller: p.seller,
                    })
                  }
                  onToggleWishlist={() =>
                    toggleItem({
                      id: p.id,
                      name: p.name,
                      price: p.price,
                      image: p.image,
                      seller: p.seller,
                      category: p.category,
                      rating: p.rating,
                    })
                  }
                  isInWishlist={isInWishlist(p.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
