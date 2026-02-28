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
  Star,
  Quote,
  Zap,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const benefits = [
  {
    icon: Store,
    title: "Boutique en ligne gratuite",
    description: "Créez votre vitrine digitale en quelques minutes, sans frais d'inscription ni commission cachée.",
  },
  {
    icon: Users,
    title: "Accès à des milliers de clients",
    description: "Touchez une audience large à travers toute la Guinée et au-delà grâce à notre marketplace.",
  },
  {
    icon: Truck,
    title: "Livraison intégrée",
    description: "Notre réseau de coursiers certifiés prend en charge la livraison rapide de vos commandes.",
  },
  {
    icon: Wallet,
    title: "Paiements sécurisés",
    description: "Recevez vos paiements de manière fiable via Orange Money, MTN ou virement bancaire.",
  },
  {
    icon: BarChart3,
    title: "Tableau de bord complet",
    description: "Suivez vos ventes, stocks, avis clients et performances en temps réel.",
  },
  {
    icon: Shield,
    title: "Support dédié 24/7",
    description: "Une équipe réactive à votre écoute pour vous accompagner dans votre croissance.",
  },
];

const steps = [
  { step: "1", title: "Inscrivez-vous", description: "Créez votre compte vendeur gratuitement en quelques clics.", icon: Zap },
  { step: "2", title: "Ajoutez vos produits", description: "Importez votre catalogue avec photos, prix et descriptions.", icon: Store },
  { step: "3", title: "Recevez des commandes", description: "Les clients achètent et vous êtes notifié instantanément.", icon: Globe },
  { step: "4", title: "Encaissez vos gains", description: "Retirez vos revenus quand vous le souhaitez.", icon: Wallet },
];

const stats = [
  { value: "500+", label: "Vendeurs actifs" },
  { value: "10K+", label: "Produits en ligne" },
  { value: "50K+", label: "Clients satisfaits" },
  { value: "98%", label: "Taux de satisfaction" },
];

const testimonials = [
  {
    name: "Mariama Diallo",
    role: "Vendeuse de vêtements",
    content: "Depuis que j'ai rejoint GuineeGo, mes ventes ont triplé. La livraison intégrée me fait gagner un temps précieux !",
    rating: 5,
    initials: "MD",
  },
  {
    name: "Ibrahima Sow",
    role: "Vendeur d'électronique",
    content: "Le tableau de bord est incroyable. Je vois mes performances en temps réel et je peux ajuster mes prix facilement.",
    rating: 5,
    initials: "IS",
  },
  {
    name: "Fatoumata Camara",
    role: "Vendeuse de cosmétiques",
    content: "Le support client est exceptionnel. Chaque fois que j'ai un souci, l'équipe répond en moins d'une heure.",
    rating: 5,
    initials: "FC",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function SellStartPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm gap-2">
                <TrendingUp className="w-4 h-4" />
                Rejoignez GuineeGo LAT
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6 leading-tight tracking-tight">
                Vendez en ligne,{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  développez votre business
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Ouvrez votre boutique sur la première marketplace de Guinée. 
                Zéro frais d'inscription, des outils puissants et un réseau de livraison intégré.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="text-base h-12 px-8 shadow-lg shadow-primary/25">
                  <Link to="/register">
                    Créer ma boutique gratuitement
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="text-base h-12 px-8">
                  <Link to="/login">
                    J'ai déjà un compte
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Inscription gratuite
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Aucune commission cachée
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Support 24/7
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <Badge variant="outline" className="mb-4">Avantages</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Pourquoi vendre sur GuineeGo ?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Tout ce dont vous avez besoin pour réussir votre commerce en ligne.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
              >
                <Card className="h-full border-border/50 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center mb-4 transition-colors">
                      <b.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <Badge variant="outline" className="mb-4">Processus</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-muted-foreground text-lg">4 étapes simples pour commencer à vendre.</p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="text-center relative"
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-px border-t-2 border-dashed border-primary/20" />
                )}
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg shadow-primary/20 relative z-10">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <Badge variant="outline" className="mb-4">Témoignages</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Découvrez ce que nos vendeurs disent de leur expérience.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
              >
                <Card className="h-full border-border/50 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <Quote className="w-8 h-8 text-primary/20 mb-3" />
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{t.content}"</p>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {t.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                      <div className="ml-auto flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, j) => (
                          <Star key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-10 md:p-16 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_hsl(var(--primary-foreground)/0.1),_transparent_60%)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
                Prêt à commencer ?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto">
                Rejoignez des centaines de vendeurs qui développent leur business avec GuineeGo LAT.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild className="text-base h-12 px-8 shadow-lg">
                  <Link to="/register">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Créer mon compte vendeur
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
