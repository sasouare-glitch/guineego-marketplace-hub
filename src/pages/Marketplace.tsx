import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryBar } from "@/components/marketplace/CategoryBar";
import { ProductCard, Product } from "@/components/marketplace/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Zap, TrendingUp, Clock, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";

// Mock products data
const flashSaleProducts: Product[] = [
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
];

const newArrivals: Product[] = [
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
];

const bestSellers: Product[] = [
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
];

const Marketplace = () => {
  const { addItem } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryBar />

      <main className="container-tight py-6 space-y-10">
        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-guinea-green to-guinea-green/80 text-white p-6 md:p-10">
          <div className="relative z-10 max-w-lg">
            <Badge className="bg-guinea-yellow text-foreground mb-4">
              Offre spéciale
            </Badge>
            <h1 className="font-display text-2xl md:text-4xl font-bold mb-3">
              Jusqu'à -50% sur l'électronique
            </h1>
            <p className="text-white/80 mb-6">
              Profitez des meilleures offres sur smartphones, laptops et accessoires. Livraison gratuite à Conakry !
            </p>
            <Button size="lg" className="bg-white text-guinea-green hover:bg-white/90">
              Découvrir les offres
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-r from-guinea-green to-transparent z-10" />
            <img
              src="https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600"
              alt="Electronics"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Features Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck, label: "Livraison rapide", desc: "Partout en Guinée" },
            { icon: Zap, label: "Paiement sécurisé", desc: "Orange & MTN Money" },
            { icon: Clock, label: "Support 24/7", desc: "Assistance client" },
            { icon: TrendingUp, label: "Meilleurs prix", desc: "Garantis" },
          ].map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{feature.label}</p>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Flash Sales */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-guinea-red/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-guinea-red" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Ventes Flash</h2>
                <p className="text-sm text-muted-foreground">Se termine dans 2h 34m</p>
              </div>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/search?sale=true" className="text-primary">
                Voir tout <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {flashSaleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => addItem(product)}
              />
            ))}
          </div>
        </section>

        {/* New Arrivals */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold">Nouveautés</h2>
            <Button variant="ghost" asChild>
              <Link to="/search?new=true" className="text-primary">
                Voir tout <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {newArrivals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => addItem(product)}
              />
            ))}
          </div>
        </section>

        {/* Category Banner */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            to="/search?category=fashion"
            className="relative rounded-xl overflow-hidden aspect-[2/1] group"
          >
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"
              alt="Fashion"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
              <h3 className="font-display text-2xl font-bold">Mode Africaine</h3>
              <p className="text-white/80">Découvrir la collection</p>
            </div>
          </Link>
          <Link
            to="/search?category=home"
            className="relative rounded-xl overflow-hidden aspect-[2/1] group"
          >
            <img
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600"
              alt="Home"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
              <h3 className="font-display text-2xl font-bold">Maison & Déco</h3>
              <p className="text-white/80">Équipez votre intérieur</p>
            </div>
          </Link>
        </div>

        {/* Best Sellers */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-guinea-yellow/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-guinea-yellow" />
              </div>
              <h2 className="font-display text-xl font-bold">Meilleures ventes</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/search?bestseller=true" className="text-primary">
                Voir tout <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => addItem(product)}
              />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Marketplace;
