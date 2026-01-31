import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartItem } from "@/components/marketplace/CartItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingBag, 
  ArrowRight, 
  Truck, 
  Shield, 
  Tag,
  Smartphone
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";

const CartPage = () => {
  const { items, updateQuantity, removeItem, subtotal, itemCount } = useCart();
  const { format } = useCurrency();
  const { t } = useTranslation();

  const deliveryFee = items.length > 0 ? 25000 : 0;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-tight py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-3">
              {t("cart.empty")}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t("cart.emptyMessage")}
            </p>
            <Button asChild size="lg">
              <Link to="/marketplace">
                {t("nav.marketplace")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-tight py-6">
        <h1 className="font-display text-2xl font-bold mb-6">
          {t("cart.title")} ({itemCount} {itemCount > 1 ? 'articles' : 'article'})
        </h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Continue Shopping */}
            <div className="mt-4">
              <Button variant="ghost" asChild>
                <Link to="/marketplace" className="text-primary">
                  ← {t("cart.continueShopping")}
                </Link>
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Promo Code */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Code promo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="Entrez votre code" className="flex-1" />
                  <Button variant="outline">Appliquer</Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">{t("checkout.orderSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                    <span>{format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("cart.delivery")}</span>
                    <span>{format(deliveryFee)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-display font-bold text-lg">
                  <span>{t("cart.total")}</span>
                  <span className="text-guinea-green">{format(total)}</span>
                </div>

                <Button className="w-full bg-guinea-green hover:bg-guinea-green/90 gap-2" size="lg" asChild>
                  <Link to="/checkout">
                    {t("cart.checkout")}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>

                {/* Payment Methods */}
                <div className="pt-4 space-y-3">
                  <p className="text-xs text-muted-foreground text-center">
                    Modes de paiement acceptés
                  </p>
                  <div className="flex justify-center gap-3">
                    <Badge variant="outline" className="gap-1">
                      <Smartphone className="w-3 h-3" />
                      Orange Money
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Smartphone className="w-3 h-3" />
                      MTN Money
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <Card className="bg-muted/50 border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium">Livraison rapide</p>
                    <p className="text-muted-foreground text-xs">2-4 jours à Conakry</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium">Paiement sécurisé</p>
                    <p className="text-muted-foreground text-xs">Transactions chiffrées</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
