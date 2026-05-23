import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  Zap,
  Crown,
  Check,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SELLER_PLANS } from "@/constants/sellerPlans";
import { cn } from "@/lib/utils";

const planIcons = {
  free: <Package className="h-8 w-8 text-muted-foreground" />,
  pro: <Zap className="h-8 w-8 text-primary" />,
  business: <Crown className="h-8 w-8 text-accent" />,
};

const faqs = [
  {
    q: "Puis-je changer de plan à tout moment ?",
    a: "Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment. Le changement prend effet immédiatement.",
  },
  {
    q: "Comment puis-je payer mon abonnement ?",
    a: "Vous pouvez payer via Orange Money, MTN MoMo ou carte bancaire. Le paiement est sécurisé et immédiat.",
  },
  {
    q: "Y a-t-il des frais cachés ?",
    a: "Non, il n'y a aucun frais caché. Le prix affiché est le seul coût mensuel de votre abonnement, en plus de la commission standard sur les ventes.",
  },
  {
    q: "Que se passe-t-il si je dépasse la limite de produits ?",
    a: "Vous recevrez une alerte lorsque vous approcherez de la limite. Pour ajouter plus de produits, vous devrez passer à un plan supérieur.",
  },
  {
    q: "Puis-je annuler mon abonnement ?",
    a: "Oui, vous pouvez annuler à tout moment depuis votre tableau de bord. Vous conservez l'accès jusqu'à la fin de la période payée.",
  },
];

export default function SellerPricingPage() {
  const formatPrice = (price: number) => {
    if (price === 0) return "Gratuit";
    return `${price.toLocaleString("fr-GN")} GNF`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 lg:pt-32">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-3xl text-center"
            >
              <Badge variant="secondary" className="mb-4">
                <TrendingUp className="mr-1 h-3 w-3" />
                Tarification vendeur
              </Badge>
              <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Choisissez le plan{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  adapté à votre business
                </span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground md:text-xl">
                Des solutions flexibles pour les vendeurs de toutes tailles. Commencez gratuitement et évoluez selon vos besoins.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link to="/sell/start">
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/seller/guide">Guide du vendeur</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Plans */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                Nos forfaits vendeur
              </h2>
              <p className="text-muted-foreground">
                De la boutique en ligne gratuite à la solution entreprise, trouvez celui qui vous convient.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {SELLER_PLANS.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card
                    className={cn(
                      "relative flex h-full flex-col transition-all hover:shadow-lg",
                      plan.recommended && "border-primary shadow-lg scale-[1.02]"
                    )}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground shadow-md">
                          Recommandé
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-2">
                      <div className="mx-auto mb-3">{planIcons[plan.id]}</div>
                      <CardTitle className="text-xl font-display">{plan.name}</CardTitle>
                      <CardDescription className="mt-2">
                        <span className="text-3xl font-bold text-foreground">
                          {formatPrice(plan.price)}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-muted-foreground text-sm"> /mois</span>
                        )}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1">
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter>
                      <Button
                        asChild
                        className="w-full"
                        variant={plan.recommended ? "default" : "secondary"}
                      >
                        <Link to="/register">
                          {plan.price === 0 ? "Commencer gratuitement" : "Choisir ce plan"}
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Commission Info */}
        <section className="bg-muted/30 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-3xl text-center"
            >
              <Badge variant="secondary" className="mb-4">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Commissions transparentes
              </Badge>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Une commission simple et claire
              </h2>
              <p className="mb-8 text-muted-foreground">
                Sarematy prélève une commission sur chaque vente pour couvrir les frais de paiement, de livraison et de plateforme. Le reste est à vous.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "Plan Gratuit", value: "5%" },
                  { label: "Plan Pro", value: "4%" },
                  { label: "Plan Business", value: "3%" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-xl border bg-card p-6"
                  >
                    <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                    <p className="text-3xl font-bold text-foreground">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">de commission par vente</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="mb-10 text-center">
                <Badge variant="secondary" className="mb-3">
                  <HelpCircle className="mr-1 h-3 w-3" />
                  Questions fréquentes
                </Badge>
                <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                  Tout savoir sur nos forfaits
                </h2>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <CardContent className="p-10 text-center md:p-14">
                <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                  Prêt à lancer votre boutique ?
                </h2>
                <p className="mx-auto mb-6 max-w-xl opacity-90">
                  Rejoignez des centaines de vendeurs qui développent leur activité grâce à Sarematy.
                </p>
                <Button asChild size="lg" variant="secondary">
                  <Link to="/sell/start">
                    Ouvrir ma boutique
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
