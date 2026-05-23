import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UserPlus,
  Store,
  Package,
  Camera,
  DollarSign,
  Truck,
  MessageCircle,
  Star,
  TrendingUp,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const steps = [
  {
    icon: UserPlus,
    title: "1. Créez votre compte",
    description:
      "Inscrivez-vous gratuitement avec votre numéro de téléphone ou votre email en moins d'une minute.",
  },
  {
    icon: Store,
    title: "2. Ouvrez votre boutique",
    description:
      "Choisissez un nom, ajoutez votre logo et décrivez votre activité pour inspirer confiance aux clients.",
  },
  {
    icon: Package,
    title: "3. Ajoutez vos produits",
    description:
      "Renseignez titre, description, catégorie, prix et stock. Plus c'est complet, plus vous vendez.",
  },
  {
    icon: Camera,
    title: "4. Soignez vos photos",
    description:
      "Utilisez des photos nettes sur fond clair. Une bonne image multiplie vos ventes par 3.",
  },
  {
    icon: DollarSign,
    title: "5. Recevez vos paiements",
    description:
      "Orange Money, MTN MoMo, carte bancaire ou cash à la livraison. Vous recevez 95% du montant.",
  },
  {
    icon: Truck,
    title: "6. Préparez et expédiez",
    description:
      "Confirmez la commande, préparez-la, puis remettez le colis à un coursier Sarematy.",
  },
];

const bestPractices = [
  {
    icon: Camera,
    title: "Photos de qualité",
    description: "3 à 5 photos minimum, fond uni, lumière naturelle.",
  },
  {
    icon: MessageCircle,
    title: "Répondez vite",
    description: "Les vendeurs qui répondent en moins d'1h vendent 2x plus.",
  },
  {
    icon: Star,
    title: "Soignez vos avis",
    description: "Demandez gentiment un avis après chaque livraison réussie.",
  },
  {
    icon: TrendingUp,
    title: "Activez les promos",
    description: "Les ventes flash boostent fortement votre visibilité.",
  },
  {
    icon: ShieldCheck,
    title: "Restez honnête",
    description: "Annoncez le vrai stock et le vrai délai. La confiance paie.",
  },
  {
    icon: Wallet,
    title: "Suivez vos finances",
    description: "Consultez vos ventes et retraits depuis votre tableau de bord.",
  },
];

const faqs = [
  {
    q: "Combien coûte la vente sur Sarematy ?",
    a: "L'inscription est gratuite. Sarematy retient 5% sur chaque vente confirmée pour couvrir la plateforme et les paiements.",
  },
  {
    q: "Quand suis-je payé ?",
    a: "Le montant est crédité dans votre portefeuille dès la livraison confirmée. Vous pouvez le retirer vers Orange Money ou MTN MoMo.",
  },
  {
    q: "Qui livre mes commandes ?",
    a: "Notre réseau de coursiers Sarematy récupère vos colis et les livre au client. Vous suivez tout en temps réel.",
  },
  {
    q: "Puis-je vendre depuis n'importe où en Guinée ?",
    a: "Oui. Les livraisons sont disponibles à Conakry et dans les principales villes, et nous étendons le réseau chaque mois.",
  },
  {
    q: "Comment booster mes ventes ?",
    a: "Activez les promotions, soignez vos photos, répondez vite aux messages et passez à un abonnement vendeur premium.",
  },
];

export default function SellerGuidePage() {
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
                <BookOpen className="mr-1 h-3 w-3" />
                Guide du vendeur
              </Badge>
              <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Vendez sereinement sur{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Sarematy
                </span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground md:text-xl">
                Tout ce qu'il faut savoir pour ouvrir votre boutique,
                gérer vos commandes et développer vos ventes en Guinée.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link to="/sell/start">
                    Commencer à vendre
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/seller/subscription">Voir les abonnements</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                6 étapes pour démarrer
              </h2>
              <p className="text-muted-foreground">
                De la création du compte à la première vente, suivez le parcours.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="h-full transition-shadow hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <step.icon className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Best practices */}
        <section className="bg-muted/30 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <Badge variant="secondary" className="mb-3">
                <Zap className="mr-1 h-3 w-3" />
                Bonnes pratiques
              </Badge>
              <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                Les clés des vendeurs qui cartonnent
              </h2>
              <p className="text-muted-foreground">
                Quelques habitudes simples qui font une vraie différence.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bestPractices.map((tip, i) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-4 rounded-lg border bg-card p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <tip.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tip.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Rules */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="mb-10 text-center">
                <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                  Règles essentielles
                </h2>
                <p className="text-muted-foreground">
                  Pour garantir la confiance sur la marketplace.
                </p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <ul className="space-y-4">
                    {[
                      "Vendre uniquement des produits autorisés par la loi guinéenne.",
                      "Décrire honnêtement l'état, le stock et le délai de préparation.",
                      "Respecter les délais de confirmation des commandes (24h max).",
                      "Communiquer de façon respectueuse avec les clients et coursiers.",
                      "Ne jamais demander un paiement en dehors de Sarematy.",
                    ].map((rule) => (
                      <li key={rule} className="flex gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-muted/30 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="mb-10 text-center">
                <Badge variant="secondary" className="mb-3">
                  <HelpCircle className="mr-1 h-3 w-3" />
                  Questions fréquentes
                </Badge>
                <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                  On répond à vos questions
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
                  Rejoignez des centaines de vendeurs qui développent leur
                  activité grâce à Sarematy.
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
