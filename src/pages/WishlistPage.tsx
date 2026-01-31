import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";

export default function WishlistPage() {
  const { items, removeItem, clearWishlist, toggleItem, isInWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();

  const handleAddAllToCart = () => {
    items.forEach((product) => {
      if (product.inStock) {
        addToCart(product);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-tight pt-24 pb-16">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2 flex items-center gap-2">
                <Heart className="w-6 h-6 text-guinea-red" />
                Mes favoris
              </h1>
              <p className="text-muted-foreground">
                {items.length === 0
                  ? "Votre liste de favoris est vide"
                  : `${items.length} produit${items.length > 1 ? "s" : ""} sauvegardé${items.length > 1 ? "s" : ""}`}
              </p>
            </div>

            {items.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearWishlist}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Tout supprimer
                </Button>
                <Button size="sm" onClick={handleAddAllToCart}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Tout ajouter au panier
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Aucun favori pour le moment
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Explorez notre marketplace et cliquez sur le cœur pour sauvegarder vos produits préférés
            </p>
            <Button asChild>
              <Link to="/marketplace">Explorer la marketplace</Link>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {items.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard
                  product={product}
                  onAddToCart={addToCart}
                  onToggleWishlist={() => toggleItem(product)}
                  isInWishlist={isInWishlist(product.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
