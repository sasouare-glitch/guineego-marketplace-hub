import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Store,
  TrendingUp,
  Shield,
  Truck,
  ArrowRight,
  CheckCircle2,
  Users,
  BarChart3,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const benefits = [
  {
    icon: Store,
    title: "Boutique en ligne gratuite",
    description: "Créez votre vitrine digitale en quelques minutes, sans frais d'inscription.",
  },
  {
    icon: Users,
    title: "Accès à des milliers de clients",
    description: "Touchez une audience large à travers toute la Guinée et au-delà.",
  },
  {
    icon: Truck,
    title: "Livraison intégrée",
    description: "Notre réseau de coursiers prend en charge la livraison de vos commandes.",
  },
  {
    icon: Wallet,
    title: "Paiements sécurisés",
    description: "Recevez vos paiements de manière fiable via mobile money ou virement.",
  },
  {
    icon: BarChart3,
    title: "Tableau de bord complet",
    description: "Suivez vos ventes, stocks et performances en temps réel.",
  },
  {
    icon: Shield,
    title: "Support dédié",
    description: "Une équipe à votre écoute pour vous accompagner dans votre croissance.",
  },
];

const steps = [
  { step: "1", title: "Inscrivez-vous", description: "Créez votre compte vendeur gratuitement en quelques clics." },
  { step: "2", title: "Ajoutez vos produits", description: "Importez votre catalogue avec photos, prix et descriptions." },
  { step: "3", title: "Recevez des commandes", description: "Les clients achètent et vous êtes notifié instantanément." },
  { step: "4", title: "Encaissez vos gains", description: "Retirez vos revenus quand vous le souhaitez." },
];

const stats = [
  { value: "500+", label: "Vendeurs actifs" },
  { value: "10K+", label: "Produits en ligne" },
  { value: "50K+", label: "Clients satisfaits" },
  { value: "98%", label: "Taux de satisfaction" },
];

export default function SellStartPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <TrendingUp className="w-4 h-4" />
                Rejoignez GuineeGo LAT
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
                Vendez en ligne,{" "}
                <span className="text-primary">développez votre business</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Ouvrez votre boutique sur la première marketplace de Guinée. 
                Zéro frais d'inscription, des outils puissants et un réseau de livraison intégré.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="text-base">
                  <Link to="/auth/register">
                    Créer ma boutique gratuitement
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="text-base">
                  <Link to="/auth/login">
                    J'ai déjà un compte
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-display font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Pourquoi vendre sur GuineeGo ?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Tout ce dont vous avez besoin pour réussir votre commerce en ligne.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <b.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-muted-foreground text-lg">4 étapes simples pour commencer à vendre.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto text-center bg-primary rounded-2xl p-10 md:p-14"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Rejoignez des centaines de vendeurs qui font confiance à GuineeGo LAT.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="text-base">
                <Link to="/auth/register">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Créer mon compte vendeur
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
