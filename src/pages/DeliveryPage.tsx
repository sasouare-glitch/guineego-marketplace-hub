import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Clock, MapPin, Shield, Smartphone, Package, 
  ArrowRight, CheckCircle2, Zap, Users, Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const stats = [
  { value: "30 min", label: "Délai moyen", icon: Clock },
  { value: "5000+", label: "Livraisons", icon: Package },
  { value: "50+", label: "Coursiers actifs", icon: Users },
  { value: "4.8/5", label: "Satisfaction", icon: Star },
];

const features = [
  {
    icon: Zap,
    title: "Livraison express",
    description: "Recevez vos commandes en moins de 30 minutes dans toute la ville de Conakry.",
  },
  {
    icon: MapPin,
    title: "Suivi en temps réel",
    description: "Suivez votre coursier en direct sur la carte avec des mises à jour GPS précises.",
  },
  {
    icon: Shield,
    title: "Colis sécurisé",
    description: "Chaque colis est scanné et vérifié à chaque étape pour garantir son intégrité.",
  },
  {
    icon: Smartphone,
    title: "Notifications instantanées",
    description: "Soyez alerté à chaque changement de statut de votre livraison.",
  },
];

const steps = [
  { step: "01", title: "Commandez", description: "Passez votre commande sur le marketplace GuineeGo" },
  { step: "02", title: "Préparation", description: "Le vendeur prépare et emballe votre commande" },
  { step: "03", title: "Collecte", description: "Un coursier récupère le colis chez le vendeur" },
  { step: "04", title: "Livraison", description: "Votre commande arrive à votre porte" },
];

const zones = [
  "Kaloum", "Dixinn", "Matam", "Ratoma", "Matoto",
  "Coyah", "Dubréka", "Kindia",
];

const DeliveryPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm font-semibold">
                  🚀 Service de livraison
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                  Livraison rapide & fiable{" "}
                  <span className="text-primary">partout en Guinée</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  GuineeGo connecte vendeurs et acheteurs grâce à un réseau de coursiers professionnels. 
                  Suivez vos colis en temps réel, du vendeur jusqu'à votre porte.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/marketplace">
                    <Button size="lg" className="text-base px-8 gap-2">
                      Commander maintenant <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="lg" variant="outline" className="text-base px-8 gap-2">
                      <Truck className="w-4 h-4" /> Devenir coursier
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
          {/* Decorative */}
          <div className="absolute -bottom-1 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Stats */}
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Pourquoi choisir notre livraison ?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Un service pensé pour la réalité guinéenne, fiable et accessible.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 lg:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Comment ça marche ?
              </h2>
              <p className="text-muted-foreground">4 étapes simples pour recevoir votre commande</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {steps.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Zones */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Zones de livraison
              </h2>
              <p className="text-muted-foreground mb-8">
                Nous couvrons les principales communes de Conakry et ses environs.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {zones.map((zone) => (
                  <Badge
                    key={zone}
                    variant="outline"
                    className="px-4 py-2 text-sm border-primary/30 text-foreground"
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary" />
                    {zone}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                D'autres zones seront bientôt disponibles. Restez connecté !
              </p>
            </div>
          </div>
        </section>

        {/* CTA Coursier */}
        <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Truck className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Devenez coursier GuineeGo
              </h2>
              <p className="text-lg opacity-90 mb-6 max-w-xl mx-auto">
                Gagnez un revenu flexible en livrant des colis dans votre ville. 
                Rejoignez notre réseau de coursiers professionnels.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {["Revenus attractifs", "Horaires flexibles", "Application dédiée"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/register" className="inline-block mt-8">
                <Button size="lg" variant="secondary" className="text-base px-8 gap-2">
                  S'inscrire comme coursier <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DeliveryPage;
