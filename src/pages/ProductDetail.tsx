import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  Share2, 
  ShoppingCart, 
  Star, 
  Minus, 
  Plus, 
  Truck, 
  Shield, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Store,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";

// Mock product data
const product = {
  id: "1",
  name: "iPhone 13 Pro Max 256GB - Graphite",
  price: 8500000,
  originalPrice: 11000000,
  discount: 23,
  images: [
    "https://images.unsplash.com/photo-1632661674596-df8be59a8a35?w=800",
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800",
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800",
    "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800",
  ],
  rating: 4.8,
  reviewCount: 234,
  seller: {
    name: "TechShop GN",
    rating: 4.9,
    productCount: 156,
    responseTime: "< 1 heure",
  },
  category: "Électronique",
  inStock: true,
  stockCount: 12,
  isBestSeller: true,
  colors: [
    { id: "graphite", name: "Graphite", hex: "#1c1c1e" },
    { id: "gold", name: "Or", hex: "#fad7a0" },
    { id: "silver", name: "Argent", hex: "#e5e5e5" },
    { id: "blue", name: "Bleu Sierra", hex: "#6699cc" },
  ],
  storage: ["128GB", "256GB", "512GB", "1TB"],
  description: `L'iPhone 13 Pro Max est le smartphone le plus puissant d'Apple. Équipé de la puce A15 Bionic, il offre des performances exceptionnelles pour tous vos usages.

Caractéristiques principales :
• Écran Super Retina XDR 6,7 pouces avec ProMotion 120Hz
• Système de caméra pro avec téléobjectif 3x
• Mode Cinématique pour des vidéos professionnelles
• Autonomie jusqu'à 28 heures de lecture vidéo
• 5G ultra-rapide pour téléchargements et streaming`,
  specifications: [
    { label: "Écran", value: "6,7 pouces Super Retina XDR" },
    { label: "Processeur", value: "A15 Bionic" },
    { label: "RAM", value: "6 Go" },
    { label: "Stockage", value: "256 Go" },
    { label: "Caméra arrière", value: "Triple 12MP" },
    { label: "Caméra avant", value: "12MP TrueDepth" },
    { label: "Batterie", value: "4352 mAh" },
    { label: "5G", value: "Oui" },
    { label: "Face ID", value: "Oui" },
    { label: "Résistance eau", value: "IP68" },
  ],
  reviews: [
    { id: 1, author: "Mamadou D.", rating: 5, date: "Il y a 2 jours", comment: "Excellent téléphone, livraison rapide. Je recommande vivement TechShop GN !" },
    { id: 2, author: "Fatoumata B.", rating: 4, date: "Il y a 1 semaine", comment: "Très bon produit, conforme à la description. Juste un peu cher mais qualité au rendez-vous." },
    { id: 3, author: "Ibrahim S.", rating: 5, date: "Il y a 2 semaines", comment: "La qualité Apple au meilleur prix en Guinée. Merci GuineeGo !" },
  ],
};

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const { t } = useTranslation();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0].id);
  const [selectedStorage, setSelectedStorage] = useState(product.storage[1]);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-GN') + ' GNF';
  };

  const handleAddToCart = () => {
    const variant = `${product.colors.find(c => c.id === selectedColor)?.name}, ${selectedStorage}`;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      rating: product.rating,
      reviewCount: product.reviewCount,
      seller: product.seller.name,
      category: product.category,
      inStock: product.inStock,
    }, quantity, variant);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t.common.linkCopied);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-tight py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/marketplace" className="hover:text-foreground">{t.nav.home}</Link>
          <span>/</span>
          <Link to="/search?category=electronics" className="hover:text-foreground">{product.category}</Link>
          <span>/</span>
          <span className="text-foreground truncate">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Navigation Arrows */}
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full"
                onClick={() => setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                onClick={() => setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.discount && (
                  <Badge className="bg-guinea-red text-white">-{product.discount}%</Badge>
                )}
                {product.isBestSeller && (
                  <Badge className="bg-guinea-yellow text-foreground">Best-seller</Badge>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                    selectedImage === index ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title & Rating */}
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-5 h-5",
                        i < Math.floor(product.rating)
                          ? "fill-guinea-yellow text-guinea-yellow"
                          : "text-muted"
                      )}
                    />
                  ))}
                  <span className="ml-1 font-medium">{product.rating}</span>
                </div>
                <span className="text-muted-foreground">({product.reviewCount} {t.product.reviews.toLowerCase()})</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-guinea-green">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Color Selection */}
            <div>
              <p className="font-medium mb-3">
                {t.product.color}: <span className="text-muted-foreground">{product.colors.find(c => c.id === selectedColor)?.name}</span>
              </p>
              <div className="flex gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={cn(
                      "w-10 h-10 rounded-full border-2 transition-all",
                      selectedColor === color.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Storage Selection */}
            <div>
              <p className="font-medium mb-3">{t.product.storage}</p>
              <div className="flex flex-wrap gap-2">
                {product.storage.map((size) => (
                  <Button
                    key={size}
                    variant={selectedStorage === size ? "default" : "outline"}
                    onClick={() => setSelectedStorage(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <p className="font-medium mb-3">{t.product.quantity}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                    disabled={quantity >= product.stockCount}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.stockCount} {t.common.available}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 bg-guinea-green hover:bg-guinea-green/90 gap-2"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5" />
                {t.marketplace.addToCart}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={cn(isWishlisted && "text-guinea-red border-guinea-red")}
              >
                <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
              </Button>
              <Button size="lg" variant="outline" onClick={handleShare}>
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto text-primary mb-1" />
                <p className="text-xs font-medium">{t.product.fastDelivery}</p>
                <p className="text-xs text-muted-foreground">{t.product.deliveryDays}</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto text-primary mb-1" />
                <p className="text-xs font-medium">{t.product.warranty}</p>
                <p className="text-xs text-muted-foreground">{t.product.warrantyMonths}</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-6 h-6 mx-auto text-primary mb-1" />
                <p className="text-xs font-medium">{t.product.freeReturn}</p>
                <p className="text-xs text-muted-foreground">{t.product.returnDays}</p>
              </div>
            </div>

            {/* Seller Info */}
            <Card className="bg-muted/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Store className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{product.seller.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-guinea-yellow text-guinea-yellow" />
                          {product.seller.rating}
                        </span>
                        <span>•</span>
                        <span>{product.seller.productCount} {t.product.sellerProducts}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    {t.common.contact}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="description" className="mt-12">
          <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0">
            <TabsTrigger 
              value="description"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              {t.product.description}
            </TabsTrigger>
            <TabsTrigger 
              value="specifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              {t.product.specifications}
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              {t.product.reviews} ({product.reviewCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-line text-muted-foreground">{product.description}</p>
            </div>
          </TabsContent>

          <TabsContent value="specifications" className="mt-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {product.specifications.map((spec, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">{spec.label}</span>
                  <span className="font-medium">{spec.value}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-6">
              {product.reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {review.author.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium">{review.author}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < review.rating
                            ? "fill-guinea-yellow text-guinea-yellow"
                            : "text-muted"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
