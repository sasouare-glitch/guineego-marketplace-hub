import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bike,
  Car,
  DollarSign,
  Clock,
  MapPin,
  Shield,
  Smartphone,
  Star,
  CheckCircle2,
  TrendingUp,
  Zap,
  Users,
  ChevronRight,
  Truck,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const benefits = [
  {
    icon: DollarSign,
    title: "Revenus attractifs",
    description: "Gagnez jusqu'à 500 000 GNF/jour avec nos bonus de performance et pourboires intégrés.",
  },
  {
    icon: Clock,
    title: "Horaires flexibles",
    description: "Travaillez quand vous voulez. Activez ou désactivez votre disponibilité en un tap.",
  },
  {
    icon: Smartphone,
    title: "App intuitive",
    description: "Navigation GPS, scanner QR, suivi en temps réel — tout dans une seule application.",
  },
  {
    icon: Shield,
    title: "Assurance incluse",
    description: "Protection accident et responsabilité civile incluse pour chaque mission effectuée.",
  },
  {
    icon: TrendingUp,
    title: "Évolution rapide",
    description: "Montez en grade et débloquez des missions premium avec de meilleures rémunérations.",
  },
  {
    icon: Users,
    title: "Communauté solidaire",
    description: "Rejoignez +2 000 coursiers actifs. Entraide, formations et événements réguliers.",
  },
];

const steps = [
  {
    step: "01",
    title: "Inscrivez-vous",
    description: "Créez votre compte en 2 minutes avec votre pièce d'identité et permis.",
  },
  {
    step: "02",
    title: "Validation rapide",
    description: "Notre équipe vérifie vos documents sous 24h. Recevez votre kit coursier.",
  },
  {
    step: "03",
    title: "Formation express",
    description: "Suivez notre formation en ligne de 30 min sur l'app et les bonnes pratiques.",
  },
  {
    step: "04",
    title: "Commencez à livrer",
    description: "Activez votre disponibilité et acceptez votre première mission !",
  },
];

const vehicleTypes = [
  { icon: Bike, label: "Moto", desc: "Idéal pour Conakry", popular: true },
  { icon: Car, label: "Voiture", desc: "Colis volumineux" , popular: false},
  { icon: Truck, label: "Camionnette", desc: "Livraisons B2B", popular: false },
];

const stats = [
  { value: "2 000+", label: "Coursiers actifs" },
  { value: "50 000+", label: "Livraisons/mois" },
  { value: "4.8/5", label: "Satisfaction client" },
  { value: "24h", label: "Validation compte" },
];

const CourierJoinPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground py-20 lg:py-28">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <Badge className="bg-accent text-accent-foreground mb-6 text-sm px-4 py-1.5 font-semibold">
                🚀 Recrutement ouvert — Rejoignez-nous !
              </Badge>
            </motion.div>
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
            >
              Devenez coursier{" "}
              <span className="text-accent">GuineeGo</span>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
            >
              Gagnez votre vie en toute liberté. Livrez des colis à travers la Guinée
              avec l'application la plus moderne d'Afrique de l'Ouest.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
            >
              <Button asChild size="xl" variant="accent" className="text-lg">
                <Link to="/register">
                  Postuler maintenant <ChevronRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="glass" className="text-lg">
                <a href="#avantages">Découvrir les avantages</a>
              </Button>
            </motion.div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary-foreground/10 rounded-full blur-3xl" />
      </section>

      {/* Stats bar */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section id="avantages" className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pourquoi devenir coursier GuineeGo ?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Des avantages concrets pour vous accompagner au quotidien
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-border/50 hover:border-primary/30">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <b.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{b.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{b.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Véhicules acceptés */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Véhicules acceptés</h2>
            <p className="text-muted-foreground">Livrez avec le véhicule qui vous convient</p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {vehicleTypes.map((v, i) => (
              <motion.div
                key={v.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className={`text-center hover:shadow-lg transition-all relative ${v.popular ? "border-primary ring-2 ring-primary/20" : "border-border/50"}`}>
                  {v.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                      Populaire
                    </Badge>
                  )}
                  <CardContent className="p-6 pt-8">
                    <v.icon className="h-10 w-10 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold text-foreground">{v.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{v.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comment rejoindre l'équipe ?
            </h2>
            <p className="text-muted-foreground text-lg">4 étapes simples pour commencer</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                className="relative text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg">
                  {s.step}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Ils livrent avec GuineeGo</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "Mamadou B.",
                role: "Coursier moto — Conakry",
                quote: "Depuis que j'ai rejoint GuineeGo, je gagne bien ma vie tout en gérant mon emploi du temps. L'appli est vraiment facile.",
                rating: 5,
              },
              {
                name: "Aissatou D.",
                role: "Coursière moto — Kankan",
                quote: "En tant que femme coursière, je me sens en sécurité grâce à l'assurance et au suivi GPS. L'équipe est super réactive.",
                rating: 5,
              },
              {
                name: "Ibrahim S.",
                role: "Coursier voiture — Conakry",
                quote: "Les bonus de performance motivent vraiment. J'ai doublé mes revenus en 3 mois grâce aux missions premium.",
                rating: 5,
              },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="h-full border-border/50">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground italic mb-4">"{t.quote}"</p>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">Conditions requises</h2>
            </motion.div>
            <motion.div
              className="grid sm:grid-cols-2 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
            >
              {[
                "Avoir 18 ans minimum",
                "Posséder un smartphone Android ou iOS",
                "Disposer d'un véhicule (moto, voiture ou camionnette)",
                "Pièce d'identité valide",
                "Permis de conduire (catégorie adaptée)",
                "Casier judiciaire vierge",
              ].map((req) => (
                <div key={req} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{req}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <Zap className="h-12 w-12 mx-auto mb-6 text-accent" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt à rouler avec nous ?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Inscrivez-vous gratuitement et commencez à gagner dès demain.
              Aucun frais d'inscription.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="xl" variant="accent" className="text-lg">
                <Link to="/register">
                  Créer mon compte coursier <ChevronRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="glass" className="text-lg">
                <Link to="/delivery">En savoir plus sur la livraison</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CourierJoinPage;
